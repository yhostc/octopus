octopus
=======

an website spider framework for nodejs, directional depth crawling

1、加载采集模块
2、应用pool，对每个模块生成资源池(每个资源池可按自己的进度抓取)。
3、每个模块使用资源句柄进行采集
4、导入路由规则
5、导入URL
6、抓取

-----------------------------------------------------------------------
1、进程管理（根据CPU核心数量决定启动相应模块数，并行或串行，管理和监控模块进程）
参数：mulitily child process,max process

2、模块管理（管理和处理请求队列，需维护请求间隔时间）
参数：idel
3、任务处理模块（负责任务执行）