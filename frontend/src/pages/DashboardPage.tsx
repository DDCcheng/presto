import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

const DashboardPage=()=>{
    const {logout}=useAuth();
    const navigate=useNavigate();

    const handleLogout = () => {
        
        logout();
        navigate('/');
    };


    return (
        <div className="min-h-screen p-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <Button variant="outline" onClick={handleLogout}>
                    Logout
                </Button>
            </div>
        </div>
    )
}

export default DashboardPage;