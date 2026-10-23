import { useMemo, useRef, useState } from 'react'
import { Icon } from '../components/ui/Icons'
import { SectionTitle, Segmented, Stepper } from '../components/ui/Widgets'
import { ThemePicker } from '../components/ThemePicker'
import { useToast } from '../components/ui/Toast'
import { useBookList } from '../hooks/useDictionary'
import { exportBackup, importBackup, useAppStore } from '../store/appStore'
import { MIN_ROUND_SIZE, ROUND_SIZE_STEP, maxRoundSizeFor } from '../core/constants'
import { buildStudyPlan, formatFinishDate } from '../core/plan'
import { THEMES, themeById } from '../core/theme'
import type { MistakeReplayMode, QuestionType } from '../core/types'
import { APP_VERSION, UPDATE_MANIFEST_URL, isNativeShell, nativeApp, requestUpdateCheck } from '../core/native'

const QUESTION_TYPES: Array<{ value: QuestionType; label: string; hint: string }> = [
  { value: 'zh2en', label: '看中选英', hint: '给中文意思，选英文单词 4 选 1' },
  { value: 'en2zh', label: '看英选中', hint: '给英文单词，选中文释义 4 选 1' },
  { value: 'listening', label: '听音辨义', hint: '听发音，选中文释义' },
  { value: 'spelling', label: '拼写题', hint: '给中文意思，直接拼写英文单词' }
]

const REPLAY_MODES: Array<{ value: MistakeReplayMode; label: string; hint: string }> = [
  { value: 'immediate', label: '立即重出', hint: '答错后隔 1 题再问一次' },
  { value: 'interval', label: '每 N 题重现', hint: '按你设置的间隔插入错题' },
  { value: 'endOfRound', label: '轮末复习', hint: '本轮错词在最后集中重考' },
  { value: 'srs', label: '智能间隔', hint: '按艾宾浩斯曲线安排（错 1 天 / 3 天 / 7 天…）' }
]

function Row({
  title,
  hint,
  children,
  stacked
}: {
  title: string
  hint?: string
  children?: React.ReactNode
  stacked?: boolean
}) {
  return (
    <div
      className={`px-4 py-3.5 ${stacked ? 'flex flex-col gap-3' : 'flex items-center justify-between gap-3'}`}
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</div>
        {hint ? (
          <div className="faint" style={{ fontSize: '0.7rem', marginTop: 2, lineHeight: 1.5 }}>
            {hint}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 999,
        border: '1px solid var(--border)',
        background: checked ? 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' : 'var(--surface-2)',
        boxShadow: checked ? '0 8px 18px -12px var(--brand-glow)' : 'none',
        position: 'relative',
        flexShrink: 0,
        transition: 'background 180ms ease',
        cursor: 'pointer'
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2.5,
          left: checked ? 22 : 3,
          width: 21,
          height: 21,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 6px rgba(15,23,42,0.28)',
          transition: 'left 180ms cubic-bezier(0.2,0.8,0.2,1)'
        }}
      />
    </button>
  )
}

export function SettingsPage() {
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const resetProgress = useAppStore((state) => state.resetProgress)
  const resetAll = useAppStore((state) => state.resetAll)
  const progress = useAppStore((state) => state.progress)
  const { books } = useBookList()
  const showToast = useToast((state) => state.show)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [confirmReset, setConfirmReset] = useState<'progress' | 'all' | null>(null)
  const app = nativeApp()
  const [checking, setChecking] = useState(false)
  const [update, setUpdate] = useState<{
    versionCode: number
    versionName: string
    url: string
    notes?: string
  } | null>(null)

  function checkUpdate() {
    if (!app) return
    setChecking(true)
    const started = requestUpdateCheck({
      onAvailable: (raw) => {
        setChecking(false)
        try {
          const info = JSON.parse(raw) as {
            versionCode: number
            versionName: string
            url: string
            notes?: string
          }
          setUpdate({ ...info, url: new URL(info.url, UPDATE_MANIFEST_URL).href })
          showToast(`发现新版本 v${info.versionName}`)
        } catch {
          showToast('版本信息解析失败', 'error')
        }
      },
      onNone: () => {
        setChecking(false)
        setUpdate(null)
        showToast('已经是最新版本')
      },
      onError: () => {
        setChecking(false)
        showToast('检查更新失败，请检查网络后重试', 'error')
      }
    })
    if (!started) {
      setChecking(false)
      showToast('当前环境不支持检查更新', 'error')
    }
  }

  const plan = useMemo(() => {
    const book = books.find((item) => item.id === settings.bookId)
    if (!book) return null
    const prefix = `${book.id}:`
    let studied = 0
    for (const key of Object.keys(progress)) if (key.startsWith(prefix)) studied += 1
    return buildStudyPlan({
      bookId: book.id,
      bookName: book.name,
      totalWords: book.count,
      studiedWords: studied,
      dailyGoal: settings.dailyGoal,
      roundSize: settings.roundSize
    })
  }, [books, settings.bookId, settings.dailyGoal, settings.roundSize, progress])

  const maxRoundSize = maxRoundSizeFor(settings.dailyGoal)

  function toggleType(type: QuestionType) {
    const has = settings.questionTypes.includes(type)
    if (has && settings.questionTypes.length === 1) {
      showToast('至少要保留一种题型', 'error')
      return
    }
    updateSettings({
      questionTypes: has ? settings.questionTypes.filter((item) => item !== type) : [...settings.questionTypes, type]
    })
  }

  function download() {
    const blob = new Blob([exportBackup()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `词芽-备份-${stamp}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    showToast('备份已导出', 'success')
  }

  async function handleImport(file: File) {
    const text = await file.text()
    const result = importBackup(text)
    showToast(result.message, result.ok ? 'success' : 'error')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="px-4 pt-5">
      <header className="mb-4">
        <h1 style={{ fontSize: '1.42rem', fontWeight: 800 }}>设置</h1>
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>
          自定义题目数量、题型、错题重现频率与发音
        </p>
      </header>

      <SectionTitle title="学习计划" />
      <div className="card p-4">
        {plan ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div style={{ fontWeight: 700 }}>{plan.bookName}</div>
                <div className="faint" style={{ fontSize: '0.72rem', marginTop: 3 }}>
                  {plan.studiedWords > 0
                    ? `已学 ${plan.studiedWords} / ${plan.totalWords} 词，还剩 ${plan.remainingWords} 词`
                    : `共 ${plan.totalWords} 词，尚未开始`}
                </div>
              </div>
              <div className="text-right" style={{ flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--brand-2)' }}>
                  {plan.days === 0 ? '已背完' : `${plan.days} 天`}
                </div>
                <div className="faint" style={{ fontSize: '0.68rem' }}>
                  {plan.days === 0 ? '整本完成' : '按当前目标'}
                </div>
              </div>
            </div>
            <div className="divider my-3" />
            <p className="muted" style={{ fontSize: '0.76rem', lineHeight: 1.65 }}>
              每天 {plan.dailyGoal} 词 · 每天约 {plan.roundsPerDay} 轮 ·{' '}
              {plan.days > 0 ? `预计 ${formatFinishDate(plan.finishDate)} 完成` : '继续保持'}
            </p>
            <button
              type="button"
              className="btn btn-soft btn-md w-full mt-3"
              onClick={() => updateSettings({ onboarded: false })}
            >
              <Icon name="refresh" size={16} />
              重新选择词书与每日目标
            </button>
          </>
        ) : (
          <p className="muted" style={{ fontSize: '0.8rem' }}>词书加载中…</p>
        )}
      </div>

      <SectionTitle title="练习设置" />
      <div className="card overflow-hidden">
        <Row
          title="每一轮题目数量"
          hint={`一轮之内会出多少道首见题（错题重现不计入），可选 ${MIN_ROUND_SIZE}–${maxRoundSize} 题：上限跟随每日目标`}
        >
          <Stepper
            value={settings.roundSize}
            min={MIN_ROUND_SIZE}
            max={maxRoundSize}
            step={ROUND_SIZE_STEP}
            suffix=" 题"
            onChange={(value) => updateSettings({ roundSize: value })}
          />
        </Row>
        <Row title="每日目标" hint="首页进度环按这个目标计算">
          <Stepper
            value={settings.dailyGoal}
            min={5}
            max={300}
            step={5}
            suffix=" 题"
            onChange={(value) => updateSettings({ dailyGoal: value })}
          />
        </Row>
        <Row title="题型" hint="可多选，每道题会从启用的题型中随机出一种" stacked>
          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPES.map((item) => {
              const active = settings.questionTypes.includes(item.value)
              return (
                <button
                  key={item.value}
                  type="button"
                  className={`chip ${active ? 'chip-active' : ''}`}
                  onClick={() => toggleType(item.value)}
                  title={item.hint}
                >
                  {active ? <Icon name="check" size={12} strokeWidth={2.6} /> : null}
                  {item.label}
                </button>
              )
            })}
          </div>
          <p className="faint" style={{ fontSize: '0.68rem' }}>
            {QUESTION_TYPES.filter((item) => settings.questionTypes.includes(item.value))
              .map((item) => item.hint)
              .join('；')}
          </p>
        </Row>
      </div>

      <SectionTitle title="错题重现" />
      <div className="card overflow-hidden">
        <Row title="错题再次出现频率" hint="决定答错的单词什么时候会再问你一次" stacked>
          <div className="grid grid-cols-2 gap-2">
            {REPLAY_MODES.map((item) => {
              const active = settings.mistakeReplayMode === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => updateSettings({ mistakeReplayMode: item.value })}
                  className="rounded-2xl px-3 py-2.5 text-left"
                  style={{
                    background: active ? 'var(--surface-3)' : 'var(--surface-2)',
                    border: `1.5px solid ${active ? 'var(--brand-2)' : 'var(--border)'}`,
                    color: 'var(--text)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{item.label}</div>
                  <div className="faint" style={{ fontSize: '0.66rem', marginTop: 2, lineHeight: 1.45 }}>
                    {item.hint}
                  </div>
                </button>
              )
            })}
          </div>
        </Row>
        {settings.mistakeReplayMode === 'interval' ? (
          <Row title="重现间隔" hint="每答完 N 道题插入一道错题">
            <Stepper
              value={settings.mistakeReplayInterval}
              min={3}
              max={50}
              step={1}
              suffix=" 题"
              onChange={(value) => updateSettings({ mistakeReplayInterval: value })}
            />
          </Row>
        ) : null}
        <Row title="移出错题本" hint="同一个词连续答对几次后不再出现在错题本">
          <Stepper
            value={settings.mistakeClearStreak}
            min={1}
            max={5}
            step={1}
            suffix=" 次"
            onChange={(value) => updateSettings({ mistakeClearStreak: value })}
          />
        </Row>
      </div>

      <SectionTitle title="发音与拼读" />
      <div className="card overflow-hidden">
        <Row title="自动朗读" hint="出现英文单词时自动发音，答对后再次朗读">
          <Toggle
            label="自动朗读"
            checked={settings.autoSpeak}
            onChange={(value) => updateSettings({ autoSpeak: value })}
          />
        </Row>
        <Row title="在线真人发音" hint="优先使用在线音频，失败时自动回退到系统语音">
          <Toggle
            label="在线真人发音"
            checked={settings.onlineAudio}
            onChange={(value) => updateSettings({ onlineAudio: value })}
          />
        </Row>
        <Row title="口音">
          <Segmented
            size="sm"
            options={[
              { value: 'us' as const, label: '美音' },
              { value: 'uk' as const, label: '英音' }
            ]}
            value={settings.accent}
            onChange={(value) => updateSettings({ accent: value })}
          />
        </Row>
        <Row title="拼写题显示音标" hint="降低拼写难度，适合初学">
          <Toggle
            label="拼写题显示音标"
            checked={settings.showPhoneticInSpelling}
            onChange={(value) => updateSettings({ showPhoneticInSpelling: value })}
          />
        </Row>
      </div>

      <SectionTitle title="外观" />
      <div className="card p-4">
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>主题配色</div>
          <div className="faint" style={{ fontSize: '0.7rem', marginTop: 2, lineHeight: 1.5 }}>
            当前「{themeById(settings.theme).name}」· 共 {THEMES.length} 套配色，选中立即生效
          </div>
        </div>
        <ThemePicker value={settings.theme} onChange={(theme) => updateSettings({ theme })} />
      </div>

      <SectionTitle title="数据管理" />
      <div className="card overflow-hidden">
        <Row title="导出备份" hint="把学习记录、错题本、自定义词表导出为 JSON 文件">
          <button type="button" className="btn btn-soft btn-sm" onClick={download}>
            <Icon name="download" size={15} />
            导出
          </button>
        </Row>
        <Row title="导入备份" hint="从备份文件恢复，会覆盖当前学习数据">
          <button type="button" className="btn btn-soft btn-sm" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={15} />
            导入
          </button>
        </Row>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleImport(file)
          }}
        />
        <Row title="重置学习进度" hint="清空已学记录、错题本与统计，保留设置">
          <button
            type="button"
            className="btn btn-soft btn-sm"
            style={{ color: 'var(--wrong)' }}
            onClick={() => setConfirmReset(confirmReset === 'progress' ? null : 'progress')}
          >
            重置
          </button>
        </Row>
        {confirmReset === 'progress' ? (
          <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'var(--surface-2)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--wrong)' }}>确定要清空全部学习记录吗？此操作不可撤销。</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-soft btn-sm"
                onClick={() => {
                  resetProgress()
                  setConfirmReset(null)
                  showToast('学习进度已重置', 'success')
                }}
              >
                确定
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(null)}>
                取消
              </button>
            </div>
          </div>
        ) : null}
        <Row title="恢复出厂设置" hint="连设置与自定义词表一起清空">
          <button
            type="button"
            className="btn btn-soft btn-sm"
            style={{ color: 'var(--wrong)' }}
            onClick={() => setConfirmReset(confirmReset === 'all' ? null : 'all')}
          >
            清空
          </button>
        </Row>
        {confirmReset === 'all' ? (
          <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'var(--surface-2)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--wrong)' }}>确定恢复到初始状态吗？</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-soft btn-sm"
                onClick={() => {
                  resetAll()
                  setConfirmReset(null)
                  showToast('已恢复出厂设置', 'success')
                }}
              >
                确定
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(null)}>
                取消
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <SectionTitle title="关于" />
      <div className="card p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <img
            src={`${import.meta.env.BASE_URL}icons/logo-512.png`}
            alt=""
            width={36}
            height={36}
            style={{ borderRadius: 11, boxShadow: '0 8px 18px -10px var(--brand-glow)' }}
          />
          <div>
            <div style={{ fontWeight: 700 }}>词芽 · 背单词</div>
            <div className="faint" style={{ fontSize: '0.72rem' }}>
              版本 {app ? app.versionName() : APP_VERSION} · 手机优先的离线词卡应用
            </div>
          </div>
        </div>
        <div className="divider my-1" />
        <p className="muted" style={{ fontSize: '0.74rem', lineHeight: 1.65 }}>
          内置词书（四级 / 六级 / 高考 3500 / 中考核心词）来自开源项目
          <a
            href="https://github.com/RealKai42/qwerty-learner"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--brand-2)', marginLeft: 4 }}
          >
            qwerty-learner
          </a>
          {' '}的公开词库，仅供个人学习使用。界面参考了万词王、百词斩等产品的交互习惯。
        </p>
        {!isNativeShell() && (
          <a
            href={`${import.meta.env.BASE_URL}download/latest.apk`}
            download="词芽.apk"
            className="flex items-center gap-3"
            style={{
              padding: '10px 12px',
              borderRadius: 14,
              background: 'var(--surface-2)',
              textDecoration: 'none',
              color: 'var(--text)'
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                background: 'var(--brand-soft)',
                color: 'var(--brand-2)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0
              }}
            >
              <Icon name="download" size={17} />
            </span>
            <span className="flex-1">
              <span style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem' }}>下载安卓安装包</span>
              <span className="faint" style={{ display: 'block', fontSize: '0.72rem', marginTop: 2 }}>
                APK · 传到手机点开即装
              </span>
            </span>
            <Icon name="chevronRight" size={16} className="faint" />
          </a>
        )}
        {app && (
          <div className="flex flex-col gap-2.5">
            <div
              className="flex items-center gap-3"
              style={{ padding: '10px 12px', borderRadius: 14, background: 'var(--surface-2)' }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 11,
                  background: 'var(--brand-soft)',
                  color: 'var(--brand-2)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0
                }}
              >
                <Icon name="refresh" size={17} />
              </span>
              <span className="flex-1">
                <span style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem' }}>检查更新</span>
                <span className="faint" style={{ display: 'block', fontSize: '0.72rem', marginTop: 2 }}>
                  {update ? `可更新到 v${update.versionName}` : `当前 v${app.versionName()} · 应用内覆盖安装`}
                </span>
              </span>
              <button
                type="button"
                className="btn btn-soft btn-sm"
                disabled={checking}
                onClick={checkUpdate}
              >
                {checking ? '检查中…' : update ? '重新检查' : '检查'}
              </button>
            </div>
            {update && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid var(--brand-2)',
                  background: 'var(--brand-soft)'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>v{update.versionName} 可用</div>
                {update.notes && (
                  <p className="muted" style={{ fontSize: '0.76rem', marginTop: 4, lineHeight: 1.6 }}>
                    {update.notes}
                  </p>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-md w-full mt-3"
                  onClick={() => {
                    app.installUpdate(update.url)
                    showToast('开始下载，下载完成后按系统提示安装')
                  }}
                >
                  <Icon name="download" size={16} />
                  立即更新
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ height: 16 }} />
    </div>
  )
}
