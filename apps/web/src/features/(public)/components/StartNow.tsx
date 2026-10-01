import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { savePendingGoal } from "@/features/goals/pending-goal";
import { PRIMARY_GOAL_CHIPS, MORE_GOAL_CHIPS, findGoalChip } from "@llb/core";

/**
 * "Start now" block. The visitor types a goal, we keep it, and after signup the New Goal form opens
 * pre-filled, so the plan starts from what they just wrote instead of an empty screen.
 */
export default function StartNow() {
  const [goal, setGoal] = useState("");
  // 0 shows the four main examples; each tap on "More ideas" moves to the next four
  const [group, setGroup] = useState(0);
  const groups = Math.ceil(MORE_GOAL_CHIPS.length / 4);
  const chips = group === 0 ? PRIMARY_GOAL_CHIPS : MORE_GOAL_CHIPS.slice((group - 1) * 4, group * 4);
  const navigate = useNavigate();
  const { user } = useAuth();

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    // A goal that is one of the examples carries its realistic timeline with it
    if (goal.trim()) savePendingGoal(goal, findGoalChip(goal)?.months);
    navigate(user ? "/goals" : "/signup");
  };

  return (
    <section id="start" className="scroll-mt-28 bg-black py-10 sm:py-14 px-5 sm:px-8">
      <div className="relative w-full overflow-hidden rounded-2xl border border-[#D2A226]/25 bg-zinc-950">
        <img
          src="/landing/freedom-sunrise-gold.jpg"
          alt=""
          loading="lazy"
          className="absolute inset-y-0 right-0 h-full w-full sm:w-1/2 object-cover opacity-30 sm:opacity-60 pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/30 pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-10 sm:max-w-[60%] lg:max-w-[48%]">
          <span className="text-[10px] font-bold tracking-[0.25em] text-[#D2A226] uppercase">Start now</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Tell us the goal. <span className="text-zinc-500">We build the plan.</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md">
            Write your goal. After signup it is pre-filled and AI builds your plan.
          </p>

          <form onSubmit={start} className="mt-5 space-y-3">
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              maxLength={300}
              placeholder="What do you want to achieve?"
              aria-label="Your goal"
              className="w-full h-11 rounded-xl border border-zinc-800 bg-black/60 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D2A226]/60"
            />
            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <button
                  key={chip.text}
                  type="button"
                  onClick={() => setGoal(chip.text)}
                  className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] text-zinc-400 hover:text-white hover:border-[#D2A226]/40 hover:-translate-y-0.5 active:scale-95 transition cursor-pointer"
                >
                  {chip.text}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setGroup((g) => (g + 1) % (groups + 1))}
                className="rounded-full px-3 py-1 text-[11px] font-semibold text-[#D2A226] underline underline-offset-4 hover:text-[#e9c468] cursor-pointer"
              >
                {group === groups ? "Back to the first ideas" : "More ideas"}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                className="llb-btn llb-btn-auto group inline-flex items-center gap-2 rounded-xl bg-[#D2A226] px-5 h-11 text-sm font-bold text-black hover:bg-[#e9c468] cursor-pointer"
              >
                Plan my goal <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <span className="text-[11px] text-zinc-500">Free in public beta. No card needed.</span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
