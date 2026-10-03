import { useState } from "react";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { BILLING_ENABLED } from "../config";
export default function Pricing() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("free");

  const plans = [
    {
      id: "free",
      name: "Free",
      credits: 100,
      price: "₹0",
      description: "Perfect for beginners interview preparation.",
      features: [
        "100 AI Interview Prep Credits",
        "Basic Performance Analysis",
        "Voice Interview Access",
        "Limited History Tracking",
      ],
      default: true,
    },
    {
      id: "basic",
      name: "Starter Pack",
      credits: 150,
      price: "₹100",
      description: "Great for focused practice and skill improvement.",
      features: [
        "150 AI Interview Prep Credits",
        "Detailed Feedback",
        "Performance Analytics",
        "Full History Tracking",
      ],
    },
    {
      id: "pro",
      name: "Pro Pack",
      credits: 650,
      price: "₹500",
      description: "Best value for serious job preparation.",
      features: [
        "650 AI Interview Prep Credits",
        "Advanced AI Feedback",
        "Skill Trend Analytics",
        "Priority AI Processing",
      ],
      badge: "Best Value",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-emerald-50 py-16 px-6">
      <div className="max-w-6xl mx-auto mb-14 flex items-start gap-4">
        <button
          aria-label="Back to home"
          onClick={() => navigate("/")}
          className="mt-2 p-3 rounded-full bg-white shadow hover:shadow-md transition"
        >
          <FaArrowLeft className="text-gray-600" />
        </button>

        <div className="text-center w-full">
          <h1 className="text-4xl font-bold text-gray-800">Choose Your Plan</h1>
          <p className="text-gray-500 mt-3 text-lg">
            Flexible pricing to match your interview preparation goals.
          </p>
        </div>
      </div>

      {!BILLING_ENABLED && (
        <div className="max-w-3xl mx-auto mb-12 bg-white border border-emerald-200 rounded-2xl shadow-sm px-6 py-5 text-center">
          <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            Coming Soon
          </span>
          <p className="text-gray-700">
            Paid plans aren&apos;t live yet. Until then every account gets{" "}
            <span className="font-semibold text-emerald-700">
              unlimited credits
            </span>{" "}
            — practise as much as you like, completely free.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <motion.div
              key={plan.id}
              whileHover={!plan.default && { scale: 1.03 }}
              onClick={() => !plan.default && setSelectedPlan(plan.id)}
              className={`relative rounded-3xl p-8 transition-all duration-300 border ${
                isSelected
                  ? "border-emerald-600 shadow-2xl bg-white"
                  : "border-gray-200 bg-white shadow-md"
              }
              ${plan.default ? "cursor-default" : "cursor-pointer"}
              `}
            >
              {/* badge */}
              {plan.badge && (
                <div className="absolute top-6 right-6 bg-emerald-600 text-white py-1 px-4 rounded-full text-xs shadow">
                  {plan.badge}
                </div>
              )}
              {/* Default Tag */}
              {plan.default && (
                <div className="absolute top-6 right-6 bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">
                  Default
                </div>
              )}
              {/* Plan Name */}
              <h3 className="text-lg font-semibold text-gray-800 mt-4">
                {plan.name}
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-emerald-600">
                  {plan.price}
                </span>
                <p className="text-gray-500 mt-1">{plan.credits} Credits</p>
              </div>
              {/* Description */}
              <p className="text-gray-500 mt-4 text-sm leading-relaxed">
                {plan.description}
              </p>
              {/* Feature */}
              <div className="mt-6 space-y-3 text-left">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <FaCheckCircle className="text-emerald-500 text-sm" />
                    <span className="text-gray-700 text-sm">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
              {!plan.default &&
                (BILLING_ENABLED ? (
                  <button
                    className={`w-full mt-8 py-3 rounded-xl font-semibold transition cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 text-white hover:opacity-90"
                        : "bg-gray-100 text-gray-700 hover:bg-emerald-50"
                    }`}
                  >
                    {isSelected ? "Proceed to Pay" : "Select Plan"}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full mt-8 py-3 rounded-xl font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                ))}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
