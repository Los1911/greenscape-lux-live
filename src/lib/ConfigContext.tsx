import { createContext, useContext } from "react";
import { supabase } from "./supabase";

interface ConfigContextType {
  supabase: typeof supabase;
}

const ConfigContext = createContext<ConfigContextType>({
  supabase,
});

export const ConfigProvider = ({ children }: any) => {
  return (
    <ConfigContext.Provider value={{ supabase }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useSupabaseClient = () => {
  const ctx = useContext(ConfigContext);
  return ctx.supabase;
};