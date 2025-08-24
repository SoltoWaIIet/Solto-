import { BlobServiceClient } from "@azure/storage-blob"

const BASE_URL = process.env.NEXT_PUBLIC_STORAGE_URL?.trim()
const SAS_TOKEN = process.env.NEXT_PUBLIC_STORAGE_SAS?.trim()

if (!BASE_URL || !SAS_TOKEN) {
  throw new Error("Storage URL or SAS token not provided.")
}

// Construct the full URL with the SAS token
const fullUrl = `${BASE_URL}${BASE_URL.includes("?") ? "&" : "?"}${SAS_TOKEN.startsWith("sv=") ? SAS_TOKEN : `sv=${SAS_TOKEN}`}`

// Initialize the BlobServiceClient
export const blobServiceClient = new BlobServiceClient(fullUrl)

/**
 * List all blob containers available in the storage account.
 * @returns {Promise<string[]>} List of container names.
 */
export async function listBlobContainers(): Promise<string[]> {
  try {
    const containers: string[] = []
    for await (const container of blobServiceClient.listContainers()) {
      containers.push(container.name)
    }
    return containers
  } catch (error) {
    console.error("Error listing blob containers:", error)
    throw new Error("Failed to list blob containers.")
  }
}

/**
 * Get a list of blobs within a specified container.
 * @param {string} containerName - The name of the container to list blobs from.
 * @returns {Promise<string[]>} List of blob names.
 */
export async function getBlobList(containerName: string): Promise<string[]> {
  try {
    const client = blobServiceClient.getContainerClient(containerName)
    const blobs: string[] = []

    // Efficiently list blobs in the container
    for await (const blob of client.listBlobsFlat()) {
      blobs.push(blob.name)
    }

    return blobs
  } catch (error) {
    console.error(`Error fetching blob list for container "${containerName}":`, error)
    throw new Error(`Failed to fetch blob list for container "${containerName}".`)
  }
}

/**
 * Get details of a specific blob from a container.
 * @param {string} containerName - The name of the container.
 * @param {string} blobName - The name of the blob to fetch.
 * @returns {Promise<string>} Blob content as string or metadata.
 */
export async function getBlobDetails(containerName: string, blobName: string): Promise<string> {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const blobClient = containerClient.getBlobClient(blobName)

    const downloadBlockBlobResponse = await blobClient.download(0)
    const downloadedData = await streamToText(downloadBlockBlobResponse.readableStreamBody)
    return downloadedData
  } catch (error) {
    console.error(`Error fetching blob details for "${blobName}" in container "${containerName}":`, error)
    throw new Error(`Failed to fetch blob details for "${blobName}" in container "${containerName}".`)
  }
}

/**
 * Helper function to convert a stream to text.
 * @param {ReadableStream} readableStream - The readable stream to convert to text.
 * @returns {Promise<string>} The content as a string.
 */
async function streamToText(readableStream: ReadableStream): Promise<string> {
  const reader = readableStream.getReader()
  const decoder = new TextDecoder()
  let done, value
  let result = ""
  
  while ({ done, value } = await reader.read(), !done) {
    result += decoder.decode(value, { stream: true })
  }
  
  result += decoder.decode() // Finalize the decoding
  return result
}
