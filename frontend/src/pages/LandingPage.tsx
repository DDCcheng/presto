
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

const LandPage =()=>{
    const navigate=useNavigate();

   return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">🪄 Presto</h1>
        <p className="text-xl text-gray-600">
          A lightweight, enjoyable presentation tool
        </p>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => navigate('/login')}>
          Login
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/register')}
        >
          Register
        </Button>
      </div>
    </div>
  );
};

export default LandPage;