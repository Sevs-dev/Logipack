// services/globalServices.ts
import * as adaptation from "./adaptation/adaptationServices";
import * as article from "./bom/articleServices";
import * as consecutive from "./consecutive/consecutiveServices";
import * as LineaTipo from "./maestras/LineaTipoAcondicionamientoService";
import * as Activities from "./maestras/activityServices";
import * as Master from "./maestras/maestraServices";
import * as Phase from "./maestras/stageServices";

export const globalServices = {
  // ===== Adaptation =====
  createAdaptation: adaptation.newAdaptation,
  getAdaptations: adaptation.getAdaptations,
  getAdaptationById: adaptation.getAdaptationsId,
  updateAdaptation: adaptation.updateAdaptation,
  deleteAdaptation: adaptation.deleteAdaptation,

  // ===== BOM =====
  newArticle: article.newArticle,
  getArticlesId: article.getArticlesId,
  getArticleByCode: article.getArticleByCode,
  updateArticle: article.updateArticle,
  deleteArticle: article.deleteArticle,
  getBoms: article.getBoms,
  getArticleByClient: article.getArticleByClient,

  // ===== Consecutive =====
  newConsecutive: consecutive.newConsecutive,
  getConsecutives: consecutive.getConsecutives,
  getConsecutivesId: consecutive.getConsecutivesId,
  updateConsecutive: consecutive.updateConsecutive,
  deleteConsecutive: consecutive.deleteConsecutive,
  getPrefix: consecutive.getPrefix,
  getConsecutiveById: consecutive.getConsecutiveById,

  // ===== LineaTipoAcondicionamiento =====
  createLineaTipoStage: LineaTipo.createStage,
  getLineaTipoStage: LineaTipo.getStage,
  deleteLineaTipoStage: LineaTipo.deleteStage,
  updateLineaTipoAcondicionamiento: LineaTipo.updateLineaTipoAcondicionamiento,
  getLineaTipoAcondicionamientoById: LineaTipo.getLineaTipoAcondicionamientoById,
  getListTipoyLineas: LineaTipo.getListTipoyLineas,
  getSelectStagesControls: LineaTipo.getSelectStagesControls,

  // ===== Activities =====
  createActivitie: Activities.createActivitie,
  getActivitie: Activities.getActivitie,
  deleteActivitie: Activities.deleteActivitie,
  getActivitieId: Activities.getActivitieId,
  getActivitieName: Activities.getActivitieName,
  updateActivitie: Activities.updateActivitie,

  // ===== Maestra =====
  createMaestra: Master.createMaestra,
  getMaestra: Master.getMaestra,
  getTipo: Master.getTipo,
  deleteMaestra: Master.deleteMaestra,
  getMaestraId: Master.getMaestraId,
  getMaestraName: Master.getMaestraName,
  updateMaestra: Master.updateMaestra,

  // ===== Stage =====
  createStage: Phase.createStage,
  getStage: Phase.getStage,
  deleteStage: Phase.deleteStage,
  getStageId: Phase.getStageId,
  getStageName: Phase.getStageName,
  updateStage: Phase.updateStage,

  // ===== Lógica compuesta entre microservicios =====
  async createFullAdaptation(data: {
    adaptationForm: FormData;
    articleData: any | any[];
    consecutiveData?: any;
  }) {
    try {
      const adaptationResult = await adaptation.newAdaptation(data.adaptationForm);

      const articles = Array.isArray(data.articleData)
        ? await Promise.all(data.articleData.map(article.newArticle))
        : [await article.newArticle(data.articleData)];

      const consecutiveResult = data.consecutiveData
        ? await consecutive.newConsecutive(data.consecutiveData)
        : null;

      return {
        adaptation: adaptationResult,
        articles,
        consecutive: consecutiveResult,
      };
    } catch (error) {
      console.error("Error en createFullAdaptation:", error);
      throw error;
    }
  },
};
