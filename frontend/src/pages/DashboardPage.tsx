import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { getStore as getStoreApi,updateStore as updateStoreApi } from "../services/api";
import type{ Presentation } from "../types";
import { useEffect,useState } from "react";
import ErrorPopup from "../components/common/ErrorPopup";
import NewPresentation from "@/components/common/NewPresentationModal";

const DashboardPage=()=>{
  const {logout,token}=useAuth();
  const navigate=useNavigate();
  const [error, setError] = useState<string | null    >(null);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(()=>{
    const getStore= async()=>{
      if (!token) return;
      try {
        const data=await getStoreApi(token);
        setPresentations(data.store.presentations || []);
      }catch(error){
        setError( error instanceof Error ? error.message : ' Failed to load presentations');
      }
    };
    getStore();
  },[token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const newPresentation=()=>{
    setShowModal(true);
  }
  const handleCreatePresentation=async(name:string,description:string,thumbnail:string)=>{
    if (!token) return;
    const newPresentation :Presentation={
      id:crypto.randomUUID(),
      name:name,
      description:description,
      thumbnail:thumbnail,
      slides:[{
        id: crypto.randomUUID(),
        elements: [],
        background: '',
        transition:'none',
      }]
    };
    const updatePresentation=[...presentations,newPresentation];// just combine newpre with oldpres,no updating, need setPresentation to update,its just a combination

    await updateStoreApi(token,{presentations:updatePresentation})//update datebase
    setPresentations(updatePresentation);//update state
    setShowModal(false);//close dialog
  }

  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" size="sm" onClick={newPresentation} aria-label="Create new presentation">
                     New Presentation
        </Button>
        <Button variant="outline" onClick={handleLogout} aria-label="Logout of account">
                    Logout
        </Button>
      </div>
      {error && (
        <ErrorPopup message={error} onClose={() => setError(null)} />
      )}
      {showModal && (
        <NewPresentation
          onClose={() => setShowModal(false)}
          onSubmit={handleCreatePresentation}
        />
      )}
      <div className="grid gap-4 mt-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {presentations.map((presentation) => (
          <div key={presentation.id} 
            className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md"
            onClick={() => navigate(`/presentation/${presentation.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate(`/presentation/${presentation.id}`);
              }
            }}
            aria-label={`Open presentation ${presentation.name}`}>
            <div className="aspect-2/1 bg-gray-200">
              {presentation.thumbnail && (
                <img src={presentation.thumbnail} className="w-full h-full object-cover" alt={`Thumbnail for ${presentation.name}`}/>
              )}
            </div>
            <div className="p-3">
              <p className="font-semibold">Name: {presentation.name}</p>
              {presentation.description && (
                <p className="text-sm text-gray-500">Description: {presentation.description}</p>
              )}
              <p className="text-sm text-gray-400">{presentation.slides.length} slides</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage;