import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"

type useCanParams = {
    permissions?: string[];
    roles?: string[];
}

export function useCan({ permissions, roles }: useCanParams) {
    const { user, isAuthenticated } = useContext(AuthContext);

    if(!isAuthenticated) {
        return false;
    }

    

    return true;
}