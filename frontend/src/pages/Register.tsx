import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/api";

const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(255, "Full name is too long."),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type SignupNoticeKind = "risky" | "unknown";

interface SignupNotice {
  kind: SignupNoticeKind;
  message: string;
}

export default function Register() {
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [signupNotice, setSignupNotice] = useState<SignupNotice | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/artworks" replace />;
  }

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setSignupNotice(null);
      const createdUser = await registerUser(values);

      if (createdUser.email_status === "risky") {
        setSignupNotice({
          kind: "risky",
          message:
            "Account created. This email looks deliverable but may be unreliable. Please verify inbox access.",
        });
        toast.success("Account created with email warning.");
        return;
      }

      if (createdUser.email_status === "unknown") {
        setSignupNotice({
          kind: "unknown",
          message:
            "Account created. We could not fully verify this email right now. Please confirm inbox access.",
        });
        toast.success("Account created. Email verification pending.");
        return;
      }

      toast.success("Account created. Please login.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Registration failed."));
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
        <h1 className="font-display text-3xl text-neutral-900 dark:text-neutral-100">
          Create Bidder Account
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Join PAUSC ART Auction as a bidder and prepare for bidding night.
        </p>

        {signupNotice ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Email verification notice
                </p>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                  {signupNotice.message}
                </p>
              </div>
              <span className="rounded-md border border-amber-300 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-700 dark:text-amber-200">
                {signupNotice.kind}
              </span>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="btn btn-secondary btn-md"
              >
                Continue to login
              </button>
            </div>
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4"
          noValidate
        >
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Full name
            </label>
            <input
              id="full_name"
              type="text"
              {...register("full_name")}
              autoComplete="name"
              className="input-field mt-2"
            />
            {errors.full_name ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.full_name.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              autoComplete="email"
              className="input-field mt-2"
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              autoComplete="new-password"
              className="input-field mt-2"
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-md w-full"
          >
            {isSubmitting ? "Creating account..." : "Create bidder account"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="text-link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
