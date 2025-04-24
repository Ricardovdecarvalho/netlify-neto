import { broadcastService } from './matchBroadcastService';

class CrawlerSchedulerService {
  private static instance: CrawlerSchedulerService;
  private intervalId: NodeJS.Timer | null = null;
  private readonly UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hora em milissegundos

  private constructor() {
    // Construtor privado para Singleton
  }

  public static getInstance(): CrawlerSchedulerService {
    if (!CrawlerSchedulerService.instance) {
      CrawlerSchedulerService.instance = new CrawlerSchedulerService();
    }
    return CrawlerSchedulerService.instance;
  }

  private async updateBroadcastData() {
    try {
      console.log('🔄 Iniciando atualização programada do crawler...');
      // Força uma atualização do cache chamando findBroadcastInfo com times fictícios
      await broadcastService.findBroadcastInfo('force', 'update');
      console.log('✅ Atualização programada concluída');
    } catch (error) {
      console.error('❌ Erro na atualização programada:', error);
    }
  }

  public startScheduler() {
    if (this.intervalId) {
      console.log('⚠️ Scheduler já está em execução');
      return;
    }

    console.log('🚀 Iniciando scheduler do crawler');
    
    // Executa imediatamente a primeira vez
    this.updateBroadcastData();

    // Configura o intervalo para atualizações subsequentes
    this.intervalId = setInterval(() => {
      this.updateBroadcastData();
    }, this.UPDATE_INTERVAL);

    console.log('✅ Scheduler iniciado com sucesso');
  }

  public stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Scheduler parado');
    }
  }
}

export const crawlerScheduler = CrawlerSchedulerService.getInstance();