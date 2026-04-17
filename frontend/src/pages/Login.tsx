import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/api";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (
    location.state as { from?: { pathname?: string } } | null
  )?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (isAuthenticated) {
    return <Navigate to={redirectPath || "/artworks"} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      toast.success("Welcome back.");
      navigate(redirectPath || "/artworks", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Login failed."));
    }
  };

  return (
    <div className="mx-auto max-w-xl px-3 py-6 sm:px-6 sm:py-10 lg:py-14">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6 lg:p-8">
        <h1 className="font-display text-2xl text-neutral-900 dark:text-neutral-100 sm:text-3xl">
          Bidder Sign In
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          Enter your bidder credentials to continue.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4"
          noValidate
        >
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
              autoComplete="current-password"
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
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-300">
          Need an account?{" "}
          <Link to="/register" className="text-link">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
