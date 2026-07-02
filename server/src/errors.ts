import { Response } from "express";
import { z } from "zod";

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  status: number;
}

export function sendError(res: Response, error: ApiError): Response {
  const { status, error: code, message, details } = error;
  const body: any = { error: code };
  if (message) body.message = message;
  if (details) body.details = details;
  return res.status(status).json(body);
}

export function validationError(details: z.ZodError): ApiError {
  return {
    error: "validation_error",
    message: "Invalid request body",
    details: details.flatten(),
    status: 400,
  };
}

export function notFoundError(resource = "resource"): ApiError {
  return {
    error: "not_found",
    message: `${resource} not found`,
    status: 404,
  };
}

export function unauthorizedError(): ApiError {
  return {
    error: "unauthenticated",
    message: "Authentication required",
    status: 401,
  };
}

export function conflictError(code: string, message: string): ApiError {
  return {
    error: code,
    message,
    status: 409,
  };
}

export function badRequestError(code: string, message: string): ApiError {
  return {
    error: code,
    message,
    status: 400,
  };
}
