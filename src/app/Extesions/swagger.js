const swaggerJsdoc = require('swagger-jsdoc'); 
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const URLServer = process.env.API_URL;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Tài liệu hệ thống quản lý thiết bị",
      version: "1.0.0",
      description: "Tài liệu API cho hệ thống quản lý mượn trả thiết bị & quà tặng.",
    },
    servers: [
      {
        url: URLServer,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, '../../routes/api/*.js'),         
  ],
};

const swaggerSpec = swaggerJsdoc(options);

// Inject thống kê API
function injectStatsToDescription(spec) {
  const paths = spec.paths || {};
  const tagCount = {};
  let total = 0;

  for (const path in paths) {
    for (const method in paths[path]) {
      const op = paths[path][method];
      if (op.tags) {
        op.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
      total++;
    }
  }

  const stats = [`📊 **Thống kê API:**`, `- Tổng số API: ${total}`];
  for (const tag in tagCount) {
    stats.push(`- ${tag}: ${tagCount[tag]}`);
  }

  const originalDesc = spec.info.description || '';
  spec.info.description = `${originalDesc}\n\n${stats.join('\n')}`;
}

injectStatsToDescription(swaggerSpec);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
