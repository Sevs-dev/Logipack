"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { getUserByEmail } from "../services/userDash/authservices";
import nookies from "nookies";
import { useRouter } from "next/navigation";

const NO_USER_ROUTE = "/pages/noneUser";

type User = {
    id: number;
    name: string;
    // Extendelo con lo que necesites
};

const useUserData = () => {
    const { isAuthenticated } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const redirectToNoneUser = useCallback(() => {
        router.push(NO_USER_ROUTE);
    }, [router]);

    useEffect(() => {
        let isMounted = true;

        const fetchUserData = async () => {
            try {
                const cookies = nookies.get(null);
                const token = cookies.token;
                const email = cookies.email;

                if (!token) {
                    if (isMounted) {
                        setError("Token no encontrado");
                        redirectToNoneUser();
                    }
                    return;
                }

                if (!email) {
                    if (isMounted) {
                        setError("Email no encontrado en cookies");
                        redirectToNoneUser();
                    }
                    return;
                }

                const userResponse = await getUserByEmail(email);
                const usuario = userResponse?.usuario;

                if (isMounted) {
                    if (usuario?.id && usuario.name) {
                        setUser(usuario);
                    } else {
                        setError("Usuario inválido o no encontrado");
                        redirectToNoneUser();
                    }
                }
            } catch (error) {
                console.error("Error fetching user:", error);
                if (isMounted) {
                    setError("Ocurrió un error al obtener el usuario");
                    redirectToNoneUser();
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (isAuthenticated) {
            fetchUserData();
        } else {
            setLoading(false);
        }

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, redirectToNoneUser]);

    return {
        user,
        userName: user?.name ?? null,
        loading,
        error,
    };
};

export default useUserData;
