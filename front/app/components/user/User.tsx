"use client";
import React, { useEffect, useState } from "react";
import nookies from "nookies";
import { useRouter, usePathname } from "next/navigation";
import { getUserByEmail, postUserImage } from "../../services/authservices";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return {};
  }
}

function User() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    created_at: "",
    image: "", // Nueva propiedad para la imagen
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const cookies = nookies.get(null);
    const token = cookies.token;
    if (token) {
      try {
        const decoded = parseJwt(token);
        if (decoded.exp > Date.now() / 1000) {
          setIsAuthenticated(true);
        } else {
          nookies.destroy(null, "token");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error al decodificar el token:", error);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [mounted]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const cookies = nookies.get(null);
        const email = cookies.email;
        if (email) {
          const decodedEmail = decodeURIComponent(email);
          const user = await getUserByEmail(decodedEmail);
          if (user) {
            setUserData({
              name: user.usuario.name,
              email: user.usuario.email,
              created_at: user.usuario.updated_at,
              image: user.usuario.image, // Cargar la imagen
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUserData();
  }, []);

  // Manejador de cambio de imagen
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedImage(event.target.files[0]);
    }
  };

  // Subir imagen
  const handleUpload = async () => {
    if (!selectedImage) return alert("Selecciona una imagen");

    try {
      const cookies = nookies.get(null);
      const email = cookies.email;
      if (!email) return alert("No se encontró el email del usuario.");

      const decodedEmail = decodeURIComponent(email);
      setLoading(true);

      const response = await postUserImage(decodedEmail, selectedImage);

      if (response.success) {
        setUserData((prev) => ({ ...prev, image: response.data.url }));
      } else {
        console.error("Error al subir imagen:", response.message);
      }
    } catch (error) {
      console.error("Error en la petición:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Perfil de Usuario</h1>
      <div className="mb-2">
        <span className="font-semibold">Nombre:</span> {userData.name || "Cargando..."}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Email:</span> {userData.email || "Cargando..."}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Fecha de Registro:</span>{" "}
        {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : "Cargando..."}
      </div>

      {/* Mostrar imagen si está disponible */}
      {userData.image && (
        <div className="mb-4">
          <img src={userData.image} alt="Foto de perfil" className="w-32 h-32 rounded-full mx-auto" />
        </div>
      )}

      {/* Input para seleccionar imagen */}
      <input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />

      {/* Botón para subir la imagen */}
      <button
        onClick={handleUpload}
        disabled={!selectedImage || loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Subiendo..." : "Subir Imagen"}
      </button>
    </div>
  );
}

export default User;
