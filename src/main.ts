import * as OpenApiValidator from "express-openapi-validator";
import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import redocExpress from "redoc-express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

import { Asset, AssetModel, AssetSubclass } from "./actions/asset";
import { Config } from "./config";
import { checkAndLogin } from "./authentication";
import { Account } from "./actions/account";

async function main() {
  const configPath = process.env.CONFIG_PATH ?? "config.json";
  const config: Config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const session = await checkAndLogin(config);

  const accountController = new Account(session);
  const assetController = new Asset(session);

  const app = express();
  app.use(express.json());

  const swaggerDocument = YAML.load("./src/openapi.yaml");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get("/docs/openapi.yaml", (_req: Request, res: Response) => {
    const yamlFilePath = path.join(__dirname, "openapi.yaml");
    res.type("yaml").sendFile(yamlFilePath);
  });

  app.get(
    "/docs",
    redocExpress({
      title: "API Documentation",
      specUrl: "/docs/openapi.yaml",
    })
  );

  // OpenAPI Validator の設定
  app.use(
    OpenApiValidator.middleware({
      apiSpec: "./src/openapi.yaml",
      validateRequests: true,
      validateResponses: true,
    })
  );
  // カスタムエラータイプを定義
  interface CustomError extends Error {
    status?: number;
    errors?: string[];
  }

  app.use(
    (err: CustomError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({
        message: err.message,
        errors: err.errors,
      });
    }
  );

  // アカウント
  app.get("/accounts", async (_req: Request, res: Response) => {
    try {
      const manualAccounts = await accountController.getManualAccounts();
      res.status(200).json(manualAccounts);
    } catch (error) {
      res.status(404).send();
    }
  });

  // 資産
  app.get(
    "/accounts/:accountString/assets",
    async (req: Request, res: Response) => {
      try {
        const { accountString } = req.params;
        const portfolios: AssetModel[] = await assetController.getAssets(
          accountString
        );
        res.status(200).json(portfolios);
      } catch (error) {
        res.status(500).send();
      }
    }
  );

  app.post(
    "/accounts/:accountString/assets",
    async (req: Request, res: Response) => {
      try {
        const { accountString } = req.params;
        const { assetSubclassId, name, value } = req.body;
        const _assetSubclassId =
          AssetSubclass[assetSubclassId as keyof typeof AssetSubclass];
        await assetController.addAsset(
          accountString,
          _assetSubclassId,
          name,
          value
        );
        res.status(201).send();
      } catch (error) {
        res.status(500).send();
      }
    }
  );

  app.delete(
    "/accounts/:accountString/assets/:assetId",
    async (req: Request, res: Response) => {
      try {
        const { accountString, assetId } = req.params;
        await assetController.deleteAsset(accountString, assetId);
        res.status(204).send();
      } catch (error) {
        const err = error as CustomError;
        if (err.status === 500) {
          res.status(404).send();
        } else {
          res.status(500).send();
        }
      }
    }
  );

  app.put(
    "/accounts/:accountString/assets/:assetId",
    async (req: Request, res: Response) => {
      try {
        const { accountString, assetId } = req.params;
        const { assetSubclassId, name, value } = req.body;
        const _assetSubclassId =
          AssetSubclass[assetSubclassId as keyof typeof AssetSubclass];
        await assetController.updateAsset(
          accountString,
          assetId,
          _assetSubclassId,
          name,
          value
        );
        res.status(204).send();
      } catch (error) {
        res.status(500).send();
      }
    }
  );

  app.listen(3001, () => {
    console.log("Server running on http://localhost:3001/api-docs");
  });
}

main().catch((error) => console.error(error));
