import { createContext, useContext } from "react";

/**
 * Create a strongly-typed React context that throws when consumed outside its provider.
 *
 * Returns `[useCtx, Provider, Context]`.
 *
 * @see https://www.totaltypescript.com/workshops/advanced-react-with-typescript/advanced-hooks/strongly-typing-react-context/solution
 */
export const createRequiredContext = <T>() => {
  const Ctx = createContext<T | null>(null);

  const useCtx = () => {
    const contextValue = useContext(Ctx);

    if (contextValue === null) {
      throw new Error("Context value is null");
    }

    return contextValue;
  };

  return [useCtx, Ctx.Provider, Ctx] as const;
};
