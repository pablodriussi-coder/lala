export const uploadImageToCloudinary = async (
  file: File,
  cloudName: string,
  uploadPreset: string
): Promise<string> => {
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary no está configurado. Por favor, configura Cloud Name y Upload Preset en los ajustes.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error al subir la imagen a Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};
