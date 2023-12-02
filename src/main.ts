import * as OpenApiValidator from 'express-openapi-validator';
import express, { Request, Response } from 'express';
import fs from "fs";
import path from 'path';
import redocExpress  from 'redoc-express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { Portfolio, PortfolioModel, AssetSubclass } from './actions/portfolio';
import { Config } from "./config";
import { checkAndLogin } from "./authentication";
import { Account } from "./actions/account";

async function main() {
  const configPath = process.env.CONFIG_PATH ?? "config.json";
  const config: Config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const session = await checkAndLogin(config);

  const account = new Account(session);
  const manualAccounts = await account.getManualAccounts();
  console.log(manualAccounts)

  const app = express();
  app.use(express.json());

  const swaggerDocument = YAML.load('./src/openapi.yaml');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get('/docs/openapi.yaml', (_req: Request, res: Response) => {
    const yamlFilePath = path.join(__dirname, 'openapi.yaml');
    res.type('yaml').sendFile(yamlFilePath);
  });

  app.get('/docs', redocExpress({
    title: 'API Documentation',
    specUrl: '/docs/openapi.yaml'
  }));

  // OpenAPI Validator の設定
  app.use(
    OpenApiValidator.middleware({
      apiSpec: './src/openapi.yaml',
      validateRequests: true,
      validateResponses: true,
    }),
  );
  
  app.use((err: any, _req: Request, res:Response, _next :any) => {
    res.status(err.status || 500).json({
      message: err.message,
      errors: err.errors,
    });
  });

  // エラーハンドリングミドルウェア
  app.use((err: any, _req: Request, res: Response, next: express.NextFunction) => {
    // バリデーションエラーの場合
    if (err.status === 400) {
      res.status(400).send(err);
    } else {
      next(err);
    }
  });

  // 資産一覧取得
  app.get('/assets', async (_req: Request, res: Response) => {
    try {
      const portfolio = new Portfolio(session); 
      const portfolios : PortfolioModel[] = await portfolio.getPortfolios(manualAccounts[0]); 
      res.status(200).json(portfolios);
      // res.status(200).json([{"portfolios":1}]);
    } catch (error) {
      res.status(500).send({ message: "error" });
    }
  });

  // 追加
  app.post('/assets', async (req: Request, res: Response) => {
    try {
      const { assetSubclassId, name, value } = req.body;
      const portfolio = new Portfolio(session);
      const _assetSubclassId = AssetSubclass[assetSubclassId as keyof typeof AssetSubclass];
      await portfolio.addPortfolio(manualAccounts[0], _assetSubclassId, name, value)
      res.status(201).send()
    } catch (error) {
      res.status(500).send({ message: "error" });
    }
  });

  // 削除
  app.delete('/assets/:assetId', async (req: Request, res: Response) => {
    try {
      const { assetId } = req.params;
      const portfolio = new Portfolio(session);
      await portfolio.deletePortfolio(manualAccounts[0], assetId );
      res.status(200).send();
    } catch (error) {
      res.status(500).send({ message: "error" });
    }
  });

  app.listen(3001, () => {
    console.log('Server running on http://localhost:3001/api-docs');
  });
}

main().catch(error => console.error(error));