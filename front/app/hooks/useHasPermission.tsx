"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getPermissionRole } from "../services/userDash/roleServices";

interface PermissionRoleResponse {
    permissions: string[];
}

// 🧠 Simple caché en memoria
const permissionCache: Record<string, string[]> = {};

export const useHasPermission = (requiredPermission: string) => {
    const { role, loading } = useAuth();
    const [hasPermission, setHasPermission] = useState(false);
    const [fetched, setFetched] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchPermissions = async () => {
            if (!role || loading) return;

            try {
                let permissions: string[];

                if (permissionCache[role]) {
                    permissions = permissionCache[role];
                } else {
                    const data: PermissionRoleResponse = await getPermissionRole(role);
                    permissionCache[role] = data.permissions;
                    permissions = data.permissions;
                }

                if (isMounted) {
                    setHasPermission(permissions.includes(requiredPermission));
                }
            } catch (error) {
                console.error("Error en getPermissionRole:", error);
            } finally {
                if (isMounted) {
                    setFetched(true);
                }
            }
        };

        fetchPermissions();

        return () => {
            isMounted = false;
        };
    }, [loading, role, requiredPermission]);

    return { hasPermission, loading: loading || !fetched };
};
