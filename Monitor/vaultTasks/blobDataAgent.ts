import { BlobServiceClient } from "@azure/storage-blob"

const BASE_URL = process.env.NEXT_PUBLIC_STORAGE_URL?.trim()
const SAS_TOKEN = process.env.NEXT_PUBLIC_STORAGE_SAS?.trim()

if (!BASE_URL || !SAS_TOKEN) {
  throw new Error("Storage URL or SAS token not provided.")
}

const fullUrl = `${BASE_URL}${BASE_URL.includes("?") ? "&" : "?"}${SAS_TOKEN.startsWith("sv=") ? SAS_TOKEN : `sv=${SAS_TOKEN}`}`
export const blobServiceClient = new BlobServiceClient(fullUrl)

export async function listBlobContainers(): Promise<string[]> {
  const containers: string[] = []
  for await (const container of blobServiceClient.listContainers()) {
    containers.push(container.name)
  }
  return containers
}

export async function getBlobList(containerName: string): Promise<string[]> {
  const client = blobServiceClient.getContainerClient(containerName)
  const blobs: string[] = []
  for await (const blob of client.listBlobsFlat()) {
    blobs.push(blob.name)
  }
  return blobs
}
