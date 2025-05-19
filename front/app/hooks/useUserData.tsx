"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { getUserByEmail } from "../services/userDash/authservices";
import nookies from "nookies";
import { useRouter } from "next/navigation";

type User = {
    id: number;
    name: string;
    // agrega más campos si los necesitas
};

const useUserData = () => {
    const { isAuthenticated } = useAuth();
    const [userName, setUserName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const redirectToNoneUser = useCallback(() => {
        router.push("/pages/noneUser");
    }, [router]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const cookies = nookies.get(null);
                const email = cookies.email;

                if (!email) {
                    redirectToNoneUser();
                    return;
                }

                const userResponse = await getUserByEmail(email);
                const name = userResponse?.usuario?.name;

                if (name) {
                    setUserName(name);
                } else {
                    redirectToNoneUser();
                }
            } catch (error) {
                console.error("Error fetching user:", error);
                redirectToNoneUser();
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchUserData();
        } else {
            setLoading(false); // importante evitar loading infinito si no está autenticado
        }
    }, [isAuthenticated, redirectToNoneUser]);

    return { userName, loading };
};

export default useUserData;
