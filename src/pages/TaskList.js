import { useParams } from "react-router-dom";
import { useEffect } from "react";

function TaskList() {
  const { empId } = useParams();

  useEffect(() => {
    if (empId) {
      console.log("Employee ID:", empId);
      // call API here
    }
  }, [empId]);

  return (
    <div>
      <h2>Tasks for Employee: {empId}</h2>
    </div>
  );
}

export default TaskList;
