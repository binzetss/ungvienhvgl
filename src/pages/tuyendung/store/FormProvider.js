import React, { useState } from "react";
import FormContext from "./form-context";
import INITIAL_FORM_DATA from "../../../components/data/reloadform";

function FormProvider({ children }) {
  const [page, setPage] = useState(1);

  const [formKey, setFormKey] = useState(Date.now());

  const [formData, setFormData] = useState(
    structuredClone(INITIAL_FORM_DATA)
  );


  const validate = () => {
    const requiredFields = [
      "fullName",
      "dob",
      "gender",
      "cccd",
      "cccdDate",
      "cccdPlace",
      "permanentAddress",
      "hometownProvince",
      "hometownWard",
      "phone",
      "email",
      "applyPosition",
      "jobDetail",
      "workExperience",
      "professionalSkills",
      "careerExpectation",
    ];

    for (const key of requiredFields) {
      const value = formData[key];
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      ) {
        console.warn("❌ Thiếu field:", key);
        return false;
      }
    }
    return true;
  };


  const resetDataState = () => {
    setFormData(structuredClone(INITIAL_FORM_DATA));
    setPage(1);                              
    setFormKey(Date.now());                        
  };

  return (
    <FormContext.Provider
      value={{
        formData,
        setFormData,
        page,
        numOfPages: 4,
        setCurrentPage: setPage,
        resetDataState,
        validate,
        formKey,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export default FormProvider;
