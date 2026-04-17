import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "../context/AuthContext";
import { authApi, getApiErrorMessage } from "../services/api";

const adminLoginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const { isAuthenticated, isAdmin, applyToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (
    location.state as { from?: { pathname?: string } } | null
  )?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (isAuthenticated) {
    return (
      <Navigate
        to={isAdmin ? redirectPath || "/admin" : "/artworks"}
        replace
      />
    );
  }

  const onSubmit = async (values: AdminLoginFormValues) => {
    try {
      const result = await authApi.adminLogin(values);
      applyToken(result.access_token);
      toast.success("Welcome back, admin.");
      navigate(redirectPath || "/admin", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Admin login failed."));
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
        <h1 className="font-display text-3xl text-neutral-900 dark:text-neutral-100">
          Admin Sign In
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Use the administrator credentials configured for this deployment.
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
              Admin Email
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
              Admin Password
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
            {isSubmitting ? "Signing in..." : "Admin sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-300">
          Bidder account?{" "}
          <Link
            to="/login"
            className="text-link"
          >
            Go to bidder login
          </Link>
        </p>
      </div>
    </div>
  );
}
