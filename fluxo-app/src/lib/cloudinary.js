const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Sube una imagen de recibo directo desde el navegador a Cloudinary
 * (unsigned upload). No pasa por /api, por eso es rapido incluso
 * con señal debil: un solo viaje de ida.
 *
 * @param {File} file - El archivo de imagen (de un <input type="file">)
 * @returns {Promise<string>} La URL segura de la imagen subida
 */
export async function uploadReceipt(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Falta configurar VITE_CLOUDINARY_CLOUD_NAME o VITE_CLOUDINARY_UPLOAD_PRESET');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    throw new Error('Error subiendo el recibo a Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Comprime una imagen en el cliente antes de subirla, reduciendo
 * el peso del archivo. Util en la calle con datos moviles limitados.
 * Redimensiona al ancho maximo indicado manteniendo proporcion.
 */
export function compressImage(file, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Error comprimiendo imagen'));
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}