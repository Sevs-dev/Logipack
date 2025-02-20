"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getUserByEmail } from "../services/authservices";
import nookies from "nookies";

type AuthContextType = {
    user: any;
    role: string | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cookies = nookies.get(); // Obtener cookies almacenadas
        const storedRole = cookies.role || null;
        setRole(storedRole);

        const encodedEmail = cookies.email || localStorage.getItem("email");
        if (!encodedEmail) {
            setLoading(false);
            return;
        }

        const decodedEmail = decodeURIComponent(encodedEmail);

        getUserByEmail(decodedEmail)
            .then((data) => {
                setUser(data.user);
                setRole(data.role || storedRole);
            })
            .catch(() => {
                setUser(null);
                setRole(null);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }
    return context;
};
