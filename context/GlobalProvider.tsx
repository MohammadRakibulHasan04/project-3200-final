import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "../lib/appwrite";

interface GlobalContextType {
    isLogged: boolean;
    setIsLogged: (value: boolean) => void;
    user: any; // Using any for now to allow flexible user object
    setUser: (value: any) => void;
    loading: boolean;
}

const GlobalContext = createContext<GlobalContextType>({
    isLogged: false,
    setIsLogged: () => {},
    user: null,
    setUser: () => {},
    loading: true
});

export const useGlobalContext = () => useContext(GlobalContext);

interface GlobalProviderProps {
    children: ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProviderProps) => {
    const [isLogged, setIsLogged] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCurrentUser()
            .then((res) => {
                if (res) {
                    setIsLogged(true);
                    setUser(res);
                } else {
                    setIsLogged(false);
                    setUser(null);
                }
            })
            .catch((error) => {
                console.log(error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <GlobalContext.Provider
            value={{
                isLogged,
                setIsLogged,
                user,
                setUser,
                loading,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export default GlobalProvider;
