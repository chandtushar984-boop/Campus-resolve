import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getDashboardPath, normalizeRole } from "../config/navigation";

const ProtectedRoute = ({ children, allowedRole, allowedRoles }) => {
    const { user, token } = useContext(AuthContext);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    const userRole = normalizeRole(user.role);
    const permitted = allowedRoles
        ? allowedRoles.map(normalizeRole)
        : allowedRole
          ? [normalizeRole(allowedRole)]
          : [];

    if (permitted.length > 0 && !permitted.includes(userRole)) {
        return <Navigate to={getDashboardPath(user.role)} replace />;
    }

    return children;
};

export default ProtectedRoute;
