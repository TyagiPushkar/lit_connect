// AdmissionFormLogic.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import AdmissionFormRenderer from "./AdmissionFormRenderer";

function AdmissionFormLogic() {
  const [pages, setPages] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [types, setTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, checkpointRes, typeRes] = await Promise.all([
          axios.get("https://namami-infotech.com/LIT/src/menu/get_menu.php"),
          axios.get("https://namami-infotech.com/LIT/src/menu/get_checkpoints.php"),
          axios.get("https://namami-infotech.com/LIT/src/menu/get_types.php"),
        ]);

        const checkpointIds = menuRes.data.data[0].CheckpointId.split(";").map(
          (p) => p.split(",").map((id) => parseInt(id))
        );

        setPages(checkpointIds);
        setCheckpoints(checkpointRes.data.data);
        setTypes(typeRes.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: false }));
  };

  const handleNext = () => {
    const currentIds = pages[currentPage];
    const newErrors = {};

    currentIds.forEach((id) => {
      const cp = checkpoints.find((c) => c.CheckpointId === id);
      const value = formData[id];
      if (!cp) return;

      const type = types.find((t) => t.TypeId === cp.TypeId)?.Type?.toLowerCase() || "";
      if (type.includes("header") || type.includes("description")) return;

      if (
        cp.Mandatory === 1 &&
        (value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === "") ||
          (Array.isArray(value) && value.length === 0))
      ) {
        newErrors[id] = true;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Swal.fire({
        icon: "error",
        title: "Missing Required Fields",
        text: "Please fill all mandatory fields before proceeding.",
      });
    } else {
      setErrors({});
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <AdmissionFormRenderer
      pages={pages}
      checkpoints={checkpoints}
      types={types}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      formData={formData}
      errors={errors}
      handleChange={handleChange}
      handleNext={handleNext}
    />
  );
}

export default AdmissionFormLogic;
