import { NextFunction, Request, Response } from "express";
import { APIResponse } from "../types";
import { catchAsync } from "../utils/catchAsync";
type FactoryModel = {
  findOneById: (id: string) => Promise<any>;
  find: (query: any) => Promise<any>;
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
};
