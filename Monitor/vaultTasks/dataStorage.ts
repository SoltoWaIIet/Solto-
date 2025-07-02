import { blobServiceClient } from "./blobDataAgent"

export async function uploadText(containerName: string, blobName: string, content: string): Promise<string> {
  const container = blobServiceClient.getContainerClient(containerName)
  const blobClient = container.getBlockBlobClient(blobName)

  await blobClient.upload(content, Buffer.byteLength(content), {
    blobHTTPHeaders: { blobContentType: "text/plain" },
  })

  return blobClient.url.split("?")[0]
}

export async function downloadText(containerName: string, blobName: string): Promise<string> {
  const container = blobServiceClient.getContainerClient(containerName)
  const blobClient = container.getBlobClient(blobName)

  const download = await blobClient.download()
  const downloaded = await streamToString(download.readableStreamBody!)
  return downloaded
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Uint8Array[] = []
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString("utf-8")
}
