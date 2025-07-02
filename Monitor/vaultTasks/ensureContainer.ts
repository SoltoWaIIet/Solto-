import { blobServiceClient } from "./blobDataAgent"

export async function ensureContainer(containerName: string): Promise<void> {
  const containerClient = blobServiceClient.getContainerClient(containerName)
  const result = await containerClient.createIfNotExists({ access: "blob" })

  if (result.succeeded) {
    console.log(`[Azure] ✅ Created new container: ${containerName}`)
  } else {
    console.log(`[Azure] ℹ️ Container already exists: ${containerName}`)
  }
}

export async function deleteContainer(containerName: string): Promise<void> {
  const containerClient = blobServiceClient.getContainerClient(containerName)
  const exists = await containerClient.exists()
  if (exists) {
    await containerClient.delete()
    console.log(`[Azure] 🗑️ Deleted container: ${containerName}`)
  } else {
    console.warn(`[Azure] ⚠️ Tried to delete non-existent container: ${containerName}`)
  }
}
