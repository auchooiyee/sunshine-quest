# 教师 CSV 学习报告

版本 0.7.0，CSV schema 2。报告描述学生在本地游戏中的当前、历史及独立复习记录，不转换为 PBD 等级、章节掌握度或 SPM 成绩。

## 导出

1. 打开 **Learning journal / Jurnal pembelajaran**。
2. 可填写 **Learner code / Kod murid**，例如教师分配的 `CYE007`。该代码由玩家填写，最多 40 字符，不涉及账号验证。
3. 点击 **Export learning CSV / Eksport CSV pembelajaran**。自由冒险下载 `mathwithcye-expedition-learning.csv`，课堂任务下载 `mathwithcye-class-learning.csv`。
4. 在 Excel 等表格工具中打开。文件为带 BOM 的 UTF-8，以保留 BM 文字；按逗号分隔，文本使用引号保护。

自由冒险每个已访问区域导出六行，已访问的综合关导出五行。课堂任务只导出其配置的三/六个章节检查或五个综合关检查。未完成的题目也保留一行。未访问区域不出现在报告中。v0.7 另外包含每个保留历史轮次的对应题目行，以及已开始复习的行；因此每个区域可有多轮记录。

JSON 导出仍用于恢复游戏存档，CSV 用于查看与整理学习记录。

## 主要字段

| 字段 | 含义 |
|---|---|
| `learner_code` | 玩家填写代码；个人导出可空，但教师汇总导入必须非空 |
| `run_id` / `run_kind` | 轮次标识；current、archived 或 review |
| `assignment_instance` / `due_label` | 课堂链接的独立身份及可选日期标签；六位配置码不包含课堂身份 |
| `source_run_id` | 复习对应的原始轮次 ID |
| `skill_tag` / `migrated_run` | 依题型产生的技能标签；轮次是否从旧存档迁移 |
| `exported_at_utc` | 本次报告导出时间，ISO 格式 UTC |
| `mode` / `mission_code` | 自由冒险或课堂任务；课堂码可辨认其配置 |
| `region_id` / `chapter` | 区域与章节；综合关列出 1、6、7、9、10 |
| `question_set` | `original-v1`、`practice-b-v1` 或 `practice-c-v1` |
| `task_id` / `task_title_en` / `task_title_ms` | 当前题组中的检查标识与双语标题 |
| `status` | 未开始、进行中、独立首答完成或有支持完成，见下表 |
| `completed` | 经过当前数学模型验证的完成状态 |
| `attempts` | 有效数学提交次数；缺字段或格式无效的提交不计入 |
| `hints_used` | 已显示的提示数，0–3；引导任务自动显示首提示 |
| `independent_first_answer` | 首次有效提交正确且没有使用提示时为 `true` |
| `xp` | 该轮检查获得的冒险 XP；未完成或复习为 0 |
| `answer_draft` | 当前答案或草稿，以 JSON 文本保存 |
| `last_attempt_at_utc` | 最近有效尝试时间；无记录时为空 |

| `status` 值 | 解读 |
|---|---|
| `not_started` | 没有草稿、提示或有效提交 |
| `in_progress` | 已有操作记录，尚未完成 |
| `completed_independent` | 首次有效提交正确，无提示 |
| `completed_supported` | 完成时使用过提示或重试 |

引导练习的完成应显示为 `completed_supported`。独立完成的 XP 与有支持完成的 XP 相同，应结合提示和尝试次数解读。

尝试次数来自每题累计状态；时间列来自最多 100 条最近有效尝试记录，较早题目的时间可能为空。记录与界面一样使用本机时间。

## 比较不同练习

Teacher mode 的 **Class report summary** 可以一次导入多个学生 CSV。以 learner_code、课堂身份（缺省时配置码）、run_id、region_id、question_set、task_id 去重，同一题保留最新导出快照。CSV v1 仍兼容，但没有 run ID，不能重建没有保存的历史轮次。

课堂链接具有独立 lesson ID；同一课堂应共享同一个链接。六位码仍用于配置，相同设置共用配置身份。可按课堂筛选并输入每行一个学生代码的名单；缺交判断仅针对所选范围与该名单。任务卡显示轮次、开始、完成、独立首答、用过提示、曾答错；这些是题目轮次计数，不是学生人数。

重玩或更换题组之前，游戏把原轮次存入历史（最多 20 轮）。历史满时拒绝自动覆盖，须先确认下载完整 JSON 备份再清理。复习用下一题组的同目标题，保留原始成绩；不额外获得 XP。

导入内容及名单只保存在当前打开页面的内存中。关闭前导出任务汇总 CSV；原始学生 CSV 和 JSON 请保留。报告来自可编辑的学生文件，不验证身份或上传云端。数学、BM 审核与真机试用仍待完成。
