import React, { useState, useEffect } from "react";
import CreateUser from './CreateUser'
import { useAuth } from '../../hooks/useAuth'
import { getUserByEmail } from '../../services/authservices';
import nookies from "nookies";

function User() {
  //UseEffect para actualizacion del token
  const { isAuthenticated } = useAuth();
  const [userName, setUserName] = useState("");
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const cookies = nookies.get(null);
        const email = cookies.email;
        if (email) {
          const decodedEmail = decodeURIComponent(email);
          const user = await getUserByEmail(decodedEmail);
          if (user.usuario) {
            setUserName(user.usuario.name);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    if (isAuthenticated) fetchUserData();
  }, [isAuthenticated]);
  // Fin useEffect

  
  return (
    <div>
      <CreateUser />
    </div>
  )
}

export default User