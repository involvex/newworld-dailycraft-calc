import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useAppDispatch } from "./state/store";
import { setIsMounted } from "./state/slices/appSlice";
import { Main } from "./pages/Main";
import { NotFound } from "./pages/NotFound";
import { Settings } from "./pages/Settings";
import { Hotkeys } from "./pages/Hotkeys";
import { Presets } from "./pages/Presets";
import { About } from "./pages/About";
import { FAQ } from "./pages/FAQ";
import { Feedback } from "./pages/Feedback";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";
import { Update } from "./pages/Update";
import { ImportExport } from "./pages/ImportExport";
import { CraftingCalculator } from "./pages/CraftingCalculator";
import { Resources } from "./pages/Resources";
import { Quests } from "./pages/Quests";
import { Tools } from "./pages/Tools";
import { Home } from "./pages/Home";
import { useHotkeys } from "react-hotkeys-hook";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "./state/store";
import { selectIsMounted } from "./state/slices/appSlice";
import { selectCurrentPage } from "./state/slices/pageSlice";
import { setCurrentPage } from "./state/slices/pageSlice";

export const App = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isMounted = useAppSelector(selectIsMounted);
  const currentPage = useAppSelector(selectCurrentPage);

  useEffect(() => {
    dispatch(setIsMounted(true));
  }, [dispatch]);

  useEffect(() => {
    dispatch(setCurrentPage(location.pathname));
  }, [dispatch, location.pathname]);

  useHotkeys(
    "ctrl+shift+i",
    () => {
      const element = document.getElementById("main-content");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    },
    { enabled: isMounted }
  );

  return (
    <React.Fragment>
      {/* Background Effects */}
      {/* ...existing code... */}
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-gray-300 min-h-screen font-sans relative overflow-hidden">
        {/* ...existing code... */}
        {/* Add proper closing div tag before the React.Fragment closing tag */}
      </div>
    </React.Fragment>
  );
};