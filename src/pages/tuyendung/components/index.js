import React from "react";
import "../../../App.css";

import FormProvider from "../store/FormProvider";
import LandingFormPage from "./LandingFormPage";

function TuyendungPage() {
  return (
    <FormProvider>
      <LandingFormPage />
    </FormProvider>
  );
}

export default TuyendungPage;
