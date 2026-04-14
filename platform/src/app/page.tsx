import { PageShell } from "@/components/layout/PageShell";
import { HeroSection } from "@/components/home/HeroSection";
import { MacroSnapshot } from "@/components/home/MacroSnapshot";
import { ModelCards } from "@/components/home/ModelCards";
import { ComparisonTable } from "@/components/home/ComparisonTable";
import { PolicyQuestions } from "@/components/home/PolicyQuestions";
import nowcastData from "../../public/data/nowcast.json";
import { NowcastData } from "@/lib/types";

const data = nowcastData as NowcastData;

export default function HomePage() {
  return (
    <PageShell>
      {/* Hero */}
      <HeroSection nowcast={data.nowcast} metadata={data.metadata} />

      <div className="px-6 lg:px-10 pb-16 space-y-12">
        {/* Macro snapshot */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Macro Snapshot — {data.metadata.data_vintage}
          </h2>
          <MacroSnapshot nowcast={data.nowcast} indicators={data.indicators} />
        </section>

        {/* Models */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Available Models</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Click a model to explore real-time estimates and policy simulations
              </p>
            </div>
          </div>
          <ModelCards />
        </section>

        {/* Policy questions */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Policy Questions</h2>
          <PolicyQuestions />
        </section>

        {/* International comparison */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              International Forecast Comparison — {data.international_forecasts[0].year}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Real GDP growth (%) — how does our DFM model compare to major institutions?
            </p>
          </div>
          <ComparisonTable forecasts={data.international_forecasts} />
        </section>
      </div>
    </PageShell>
  );
}
