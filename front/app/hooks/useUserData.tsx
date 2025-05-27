import { useAuth } from "../context/AuthProvider";

const useUserData = () => {
  const { user, role, loading } = useAuth();

  return {
    user,
    userName: user?.name ?? null,
    userId: user?.id ?? null,
    role,
    loading,
  };
};

export default useUserData;
