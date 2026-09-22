/* Discovery labels only. Never add these briefs to model requests.
 * Group by the business decision each case supports, not by its source or type.
 * Boundary cases: B02/C03 stay with document review; C10 stays with retrieval
 * despite its safety checks; B05 checks logging safety; B18 supports demand
 * planning rather than customer routing; B19/C13 support data quality.
 */
const templateBusinessGroups=Object.freeze({
 customer:'客服与客户经营',
 safety:'内容审核与安全',
 knowledge:'知识检索与文档',
 data:'数据整理与分类',
 review:'业务审核与评估',
 action:'工具选择与控制'
});

const templateBusinessMeta=Object.freeze({
 B01:{group:'knowledge',brief:'用户咨询重复扣费时，从知识库候选段落中查找处理依据，并判断材料能否回答问题。'},
 B02:{group:'knowledge',brief:'筛选数据库故障恢复论文时，核对摘要的研究主题、实验依据和方法说明，整理待阅读文献。'},
 B03:{group:'action',brief:'面对数据库迁移方案比较需求，判断任务类型和复杂度，供程序选择合适的处理方式。'},
 B04:{group:'safety',brief:'查询订单前，核对检索文本和拟执行操作是否越权，供程序决定放行或复核。'},
 B05:{group:'safety',brief:'代码评审时，对照日志规则检查登录函数是否记录敏感信息，标出需要复核的事项。'},
 B06:{group:'customer',brief:'分析客户回访记录，识别竞品试用、续费态度和使用障碍，为客户流失评估提供线索。'},
 B07:{group:'review',brief:'核对后端工程师简历中的开发与分布式任务经验，整理岗位匹配证据供招聘人员复核。'},
 B08:{group:'customer',brief:'收到企业客户咨询后，判断需求匹配程度、试点意向和沟通方向，便于销售跟进。'},
 B09:{group:'customer',brief:'客户反馈接口故障时，判断处理团队、紧急程度、退款诉求和不满程度，供客服分流与跟进。'},
 B10:{group:'review',brief:'对照报案材料清单，判断车辆事故类型和缺少的说明，安排补充材料与审核。'},
 B11:{group:'review',brief:'交易告警出现服务商名称差异时，核对主体关系与付款用途依据，供调查人员复核。'},
 B12:{group:'review',brief:'对照内部采购要求，检查合同是否明确数据删除与分包通知条款，整理法务复核事项。'},
 B13:{group:'data',brief:'整理旅行水壶的商品描述，判断所属类目、接触食品的材料和电加热功能，填写商品属性。'},
 B14:{group:'safety',brief:'审核社区评论时，判断批评对象、是否涉及人身攻击及严重程度，供平台按规则处理。'},
 B15:{group:'safety',brief:'发布广告前，核对文案与落地页的收费条件、有效期和主题是否一致，交运营复核。'},
 B16:{group:'customer',brief:'收到玩家反馈后，判断问题类别、退出意向和不满程度，供客服处理和玩家运营跟进。'},
 B17:{group:'review',brief:'阅读供应商事件说明，判断交付中断、数据暴露的迹象及业务影响，安排风险复核。'},
 B18:{group:'review',brief:'整理销售笔记中的采购计划、供货担忧和产品需求，为后续需求预测提供线索。'},
 B19:{group:'data',brief:'整理企业关系资料时，核对候选关系是否有原文依据，供数据维护人员决定是否收录。'},
 C01:{group:'review',brief:'收到车辆维修索赔后，对照保单判断租车费用范围与材料是否齐全，安排必要的人工复核。'},
 C02:{group:'safety',brief:'处理论坛帖子时，结合正文、上下文和社区政策判断违规类别，选择相应审核队列。'},
 C03:{group:'knowledge',brief:'阅读一份内部安全政策，同时核对报告义务、报告时限和培训要求，整理政策检查表。'},
 C04:{group:'knowledge',brief:'用户询问取消订阅后的使用期限时，判断候选片段能否提供答案，供检索系统排序。'},
 C05:{group:'knowledge',brief:'在产品条款中查找取消订阅后的使用期限，判断是否有答案并定位对应原文行。'},
 C06:{group:'knowledge',brief:'整理排版丢失的迁移通知，判断相邻行能否合并及文本块类型，供程序恢复文档结构。'},
 C07:{group:'action',brief:'收到证券价格图表需求后，判断应选的功能、证券和时间范围，供程序校验并调用。'},
 C08:{group:'action',brief:'收到制作产品介绍幻灯片的需求后，核对可用技能的工作范围，为助手推荐适用工具。'},
 C09:{group:'data',brief:'整理两份商品目录时，核对名称、品牌和规格，判断记录应分开保留、关联还是人工复核。'},
 C10:{group:'knowledge',brief:'知识库问答前，检查候选片段的相关性、可用依据和潜在冲突，供回答环节选用材料。'},
 C11:{group:'knowledge',brief:'复核回答中的引用时，对照来源章节判断它是否支持结论，标记需要进一步核查的内容。'},
 C12:{group:'safety',brief:'客服助手回复前，分别检查用户请求和待发送回复是否涉及内部信息泄露，供程序审核。'},
 C13:{group:'data',brief:'核对商品原文与已有提取结果，判断试用天数和价格是否有依据或遗漏，决定是否重新提取。'},
 C14:{group:'data',brief:'从通知中识别申请截止时间的日期与星期组成，供程序结合参考日期计算并校验。'},
 C15:{group:'data',brief:'一封邮件中出现多个邮箱时，判断收据应发往哪个候选地址，供程序提取原始邮箱。'},
 C16:{group:'data',brief:'整理商品目录时，逐层判断商品所属类别，供程序沿现有分类目录继续查找细分类目。'},
 C17:{group:'data',brief:'整理葡萄酒品鉴文字，判断果香强度和余味描述，转为后续评分预测可用的数据。'},
 C18:{group:'data',brief:'整理企业资料时，按实际业务判断行业归属，供程序选择细分类别或安排更宽泛的分类。'},
 D01:{group:'action',brief:'收到家居控制需求后，判断操作范围、设备与动作，供程序选择已接入的设备操作。'}
});

const featuredOfficialTemplates=Object.freeze([
 {id:'B16',label:'游戏社区与玩家支持',reason:'从玩家反馈中判断问题类别、退出意向和不满程度。'},
 {id:'B14',label:'内容审核与社区安全',reason:'根据社区规则判断评论是否涉及人身攻击及其严重程度。'},
 {id:'B13',label:'电商商品处理',reason:'根据商品描述判断类目、材料和功能，整理商品属性。'},
 {id:'B10',label:'保险理赔材料初筛',reason:'对照材料清单判断事故类型与缺失信息，安排补充材料和复核。'}
]);
