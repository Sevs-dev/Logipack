"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "../components/loader/Loader";
import nookies from "nookies";

function withAuth<P extends {}>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  const AuthComponent: React.FC<P> = (props: P) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const cookies = nookies.get(null);
      console.log("Cookies leídas con nookies:", cookies);
      
      const token = cookies.token;
      console.log("Valor de token:", token);
      
      if (!token || token.trim() === "") {
        console.warn("No se encontró un token válido. Redirigiendo...");
        router.push("/");
      } else {
        console.log("Token válido encontrado. Permitiendo acceso.");
        setLoading(false);
      }
    }, [router]);

    if (loading) {
      return <Loader />;
    }
    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
}

export default withAuth;
