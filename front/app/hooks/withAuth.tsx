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
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
      const cookies = nookies.get(null);
      const token = cookies.token;

      if (!token) {
        console.warn("🔐 Acceso denegado. Redirigiendo a la vaca 🐄");
        router.replace("/pages/noneUser");
      } else {
        setIsAllowed(true);
      }
    }, [router]);

    if (!isAllowed) {
      return <Loader />;
    }

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
}

export default withAuth;
