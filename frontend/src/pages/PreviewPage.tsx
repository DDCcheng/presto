import { useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import { getStore as getStoreApi } from "../services/api";
import type { Presentation } from "../types";

const PreviewPage = () => {
  return (
    <div>
      Hello World
    </div>
  );
};

export default PreviewPage;