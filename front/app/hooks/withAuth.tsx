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
      const token = cookies.token;

      if (!token || token.trim() === "") {
        console.warn("Token no encontrado. Redirigiendo a la vaca... 🐄");
        router.push("/pages/noneUser");
      } else {
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
