import { createRoot } from "react-dom/client";
import { Mcu } from "../../src/Mcu";
import { Layout, Scheme, Shades } from "../../src/Mcu.stories.helpers";

import "../../src/tailwind.css";
import "./figma.css";

function App() {
  return (
    <Mcu source="#769CDF" contrast={0}>
      <Layout notext>
        <Scheme>
          <Shades noTitle />
        </Scheme>
      </Layout>
    </Mcu>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
