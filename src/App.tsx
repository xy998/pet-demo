import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Upload,
  message,
} from "antd";
import type { UploadFile } from "antd";
import dayjs from "dayjs";
import QRCode from "qrcode";
import { api } from "./api";
import type { Memory, Pet, User } from "./api";
import "./App.css";

type Route = { name: string; id?: string; slug?: string };
function getRoute(): Route {
  const parts = location.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (!parts[0]) return { name: "home" };
  if (["login", "register"].includes(parts[0])) return { name: parts[0] };
  if (parts[0] === "p") return { name: "public", slug: parts[1] };
  if (parts[0] === "dashboard")
    return { name: parts[1] || "dashboard", id: parts[2] };
  return { name: "home" };
}
function navigate(path: string) {
  history.pushState({}, "", path);
  dispatchEvent(new PopStateEvent("popstate"));
}
function Image({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  return src ? (
    <img src={src} alt={alt} className={className} />
  ) : (
    <div className={`${className} image-placeholder`} aria-label={alt}>
      ✦
    </div>
  );
}
function Loading() {
  return (
    <div className="loading">
      <span />
      正在加载
    </div>
  );
}
function Notice({ text }: { text: string }) {
  return <Alert className="notice" type="error" showIcon message={text} />;
}
function Empty({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="empty">
      <span>✦</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Button type="primary" shape="round" onClick={onAction}>
        {action} →
      </Button>
    </div>
  );
}
function Layout({
  user,
  children,
  onLogout,
}: {
  user: User | null;
  children: ReactNode;
  onLogout: () => void;
}) {
  return (
    <div className="site">
      <header className="nav">
        <button className="wordmark" onClick={() => navigate("/")}>
          ✦ <b>宠物时光</b>
        </button>
        <nav>
          <button onClick={() => navigate("/dashboard")}>我的宠物</button>
          <button onClick={() => navigate("/")}>关于</button>
          {user ? (
            <>
              <span className="user-chip">
                {user.email.slice(0, 1).toUpperCase()}
              </span>
              <button className="text-button" onClick={onLogout}>
                退出
              </button>
            </>
          ) : (
            <button className="nav-login" onClick={() => navigate("/login")}>
              登录
            </button>
          )}
        </nav>
        <button className="mobile-menu" aria-label="打开菜单">
          ☰
        </button>
      </header>
      {children}
    </div>
  );
}
function Home({ user, authReady }: { user: User | null; authReady: boolean }) {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">A LITTLE LIFE, A LOT OF LOVE</span>
          <h1>
            每一天的陪伴，
            <br />
            <em>都值得好好收藏。</em>
          </h1>
          <p>
            一张属于 TA 的名片，一本属于你们的回忆录。
            <br />
            从第一次见面，到一起慢慢长大。
          </p>
          <div className="hero-actions">
            <Button
              type="primary"
              shape="round"
              disabled={!authReady}
              onClick={() => navigate(user ? "/dashboard/new" : "/register")}
            >
              {user ? "添加宠物 ↗" : "创建我们的故事 ↗"}
            </Button>
            {authReady && !user && (
              <button
                className="text-button"
                onClick={() => navigate("/login")}
              >
                登录后开始 →
              </button>
            )}
          </div>
          <small>专属名片 · 图文回忆 · 永久分享</small>
        </div>
        <div className="hero-card">
          <div className="card-top">
            <span>✦ PET JOURNAL</span>
            <span>YOUR STORY</span>
          </div>
          <div className="hero-avatar">🐾</div>
          <h2>把陪伴写成一封信</h2>
          <p>头像、性格和每个想珍藏的瞬间，组成一张属于 TA 的成长名片。</p>
          <div className="hero-line">
            <span>MEMORIES</span>
            <b>一页页，慢慢长大</b>
          </div>
        </div>
      </section>
      <section className="features">
        <Feature
          n="01 / PROFILE"
          title="认识独一无二的 TA"
          text="头像、性格和小小偏爱，组成专属的成长名片。"
          icon="◒"
        />
        <Feature
          n="02 / MEMORIES"
          title="把回忆一页页留下"
          text="一段文字、一张照片，记录每一个想珍藏的瞬间。"
          icon="✧"
        />
        <Feature
          n="03 / SHARE"
          title="分享给在乎的人"
          text="生成永久链接和二维码，让亲友一起见证成长。"
          icon="↗"
        />
      </section>
    </main>
  );
}
function Feature({
  n,
  title,
  text,
  icon,
}: {
  n: string;
  title: string;
  text: string;
  icon: string;
}) {
  return (
    <article className="feature">
      <span className="feature-icon">{icon}</span>
      <span className="eyebrow">{n}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Auth({
  mode,
  onAuth,
}: {
  mode: "login" | "register";
  onAuth: (u: User) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 12) return setError("密码至少需要 12 位");
    setBusy(true);
    try {
      const result =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(email, password, birthday);
      onAuth(result.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-page">
      <div className="auth-card">
        <span className="brand-star">✦</span>
        <span className="eyebrow">
          {mode === "login" ? "WELCOME BACK" : "START YOUR STORY"}
        </span>
        <h1>{mode === "login" ? "欢迎回来" : "创建你的账号"}</h1>
        <p>
          {mode === "login"
            ? "继续记录你们一起长大的每一天。"
            : "从一张名片开始，为 TA 留下一个温柔的角落。"}
        </p>
        <form onSubmit={submit}>
          <label>
            邮箱
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            密码
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={12}
              placeholder="至少 12 位"
            />
          </label>
          {mode === "register" && (
            <label>
              生日 <small>选填</small>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </label>
          )}
          {error && <p className="error">{error}</p>}
          <button className="button primary full" disabled={busy}>
            {busy ? "处理中…" : mode === "login" ? "登录 →" : "创建账号 →"}
          </button>
        </form>
        <p className="auth-switch">
          {mode === "login" ? "还没有账号？" : "已经有账号？"}{" "}
          <button
            onClick={() => navigate(mode === "login" ? "/register" : "/login")}
          >
            {mode === "login" ? "创建账号" : "去登录"}
          </button>
        </p>
      </div>
    </main>
  );
}

function Dashboard({ user }: { user: User }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .pets()
      .then(setPets)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <main className="content">
      <div className="heading-row">
        <div>
          <span className="eyebrow">YOUR LITTLE WORLD</span>
          <h1>我的宠物</h1>
          <p>把每一个值得记住的日子，好好放在这里。</p>
        </div>
        <Button
          type="primary"
          shape="round"
          onClick={() => navigate("/dashboard/new")}
        >
          ＋ 添加宠物
        </Button>
      </div>
      {loading && <Loading />}
      {error && <Notice text={error} />}
      {!loading && !error && pets.length === 0 && (
        <Empty
          title="还没有宠物名片"
          text="创建第一张名片，把 TA 的故事留在这里。"
          action="创建宠物"
          onAction={() => navigate("/dashboard/new")}
        />
      )}
      {pets.map((pet) => (
        <PetCard
          key={pet.id}
          pet={pet}
          onDeleted={(id) =>
            setPets((items) => items.filter((item) => item.id !== id))
          }
        />
      ))}
      <div className="account-caption">当前登录：{user.email}</div>
    </main>
  );
}
function PetCard({
  pet,
  onDeleted,
}: {
  pet: Pet;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const remove = async () => {
    setDeleting(true);
    try {
      await api.deletePet(pet.id);
      onDeleted(pet.id);
      message.success(`${pet.name}的名片已删除`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除宠物失败");
    } finally {
      setDeleting(false);
    }
  };
  return (
    <article className="pet-card">
      <Image src={pet.avatarUrl} alt={pet.name} className="pet-avatar" />
      <div className="pet-content">
        <span className={`pill ${pet.isPublished ? "green" : "muted-pill"}`}>
          {pet.isPublished ? "● 已发布" : "● 草稿"}
        </span>
        <h2>{pet.name}</h2>
        <p>
          {pet.breed || "未设置品种"} · {pet.viewCount || 0} 次查看
        </p>
        <div className="card-links">
          <Button
            shape="round"
            className="soft-ant"
            onClick={() => navigate(`/dashboard/edit/${pet.id}`)}
          >
            编辑资料
          </Button>
          <button
            className="text-button"
            onClick={() => navigate(`/dashboard/memories/${pet.id}`)}
          >
            成长回忆 →
          </button>
          <button
            className="text-button"
            onClick={() => navigate(`/dashboard/share/${pet.id}`)}
          >
            分享 →
          </button>
          <Popconfirm
            title={`删除${pet.name}的名片？`}
            description="成长回忆将不再显示，已上传的图片文件会保留。"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true, loading: deleting }}
            onConfirm={remove}
          >
            <Button type="text" danger size="small" loading={deleting}>
              删除
            </Button>
          </Popconfirm>
        </div>
      </div>
    </article>
  );
}

type PetFormValues = Omit<Partial<Pet>, "birthday" | "arrivalDate"> & {
  birthday?: dayjs.Dayjs;
  arrivalDate?: dayjs.Dayjs;
};

function PetEditor({ id }: { id?: string }) {
  const isNew = !id;
  const [form] = Form.useForm<PetFormValues>();
  const [avatar, setAvatar] = useState<UploadFile[]>([]);
  const [busy, setBusy] = useState(!isNew);
  const [error, setError] = useState("");
  useEffect(() => {
    if (id)
      api
        .pet(id)
        .then((data) => {
          form.setFieldsValue({
            ...data,
            birthday: data.birthday ? dayjs(data.birthday) : undefined,
            arrivalDate: data.arrivalDate ? dayjs(data.arrivalDate) : undefined,
          });
        })
        .catch((e) => setError(e.message))
        .finally(() => setBusy(false));
  }, [id, form]);
  const submit = async (raw: PetFormValues) => {
    setBusy(true);
    setError("");
    try {
      const values: Partial<Pet> = {
        ...raw,
        birthday: raw.birthday?.format("YYYY-MM-DD") || null,
        arrivalDate: raw.arrivalDate?.format("YYYY-MM-DD") || null,
      };
      const avatarFile = avatar[0]?.originFileObj;
      if (avatarFile)
        values.avatarUrl = (await api.uploadImage(avatarFile, "avatar")).url;
      const saved = isNew
        ? await api.createPet(values)
        : await api.updatePet(id!, values);
      message.success(isNew ? "宠物已添加" : "资料已保存");
      navigate(isNew ? "/dashboard" : `/dashboard/edit/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="content narrow">
      <button className="back" onClick={() => navigate("/dashboard")}>
        ← 返回我的宠物
      </button>
      <div className="form-title">
        <span className="eyebrow">PROFILE</span>
        <h1>{isNew ? "创建一张名片" : "编辑资料"}</h1>
        <p>让 TA 的故事，从一个名字开始。</p>
      </div>
      <Form
        className="panel form ant-form-warm"
        form={form}
        layout="vertical"
        onFinish={submit}
        disabled={busy}
      >
        <Form.Item
          name="name"
          label="名字"
          rules={[{ required: true, message: "请输入名字" }]}
        >
          <Input placeholder="例如：六一" />
        </Form.Item>
        <div className="two-col">
          <Form.Item name="species" label="类型" initialValue="dog">
            <Select
              options={[
                { value: "dog", label: "狗狗" },
                { value: "cat", label: "猫咪" },
                { value: "other", label: "其他" },
              ]}
            />
          </Form.Item>
          <Form.Item name="breed" label="品种">
            <Input placeholder="例如：柴犬" />
          </Form.Item>
        </div>
        <Form.Item name="bio" label="关于 TA">
          <Input.TextArea
            rows={5}
            maxLength={2000}
            showCount
            placeholder="写下 TA 的性格、喜欢的事物……"
          />
        </Form.Item>
        <div className="two-col">
          <Form.Item name="birthday" label="生日">
            <DatePicker className="full-input" />
          </Form.Item>
          <Form.Item name="arrivalDate" label="来到家的日子">
            <DatePicker className="full-input" />
          </Form.Item>
        </div>
        <div className="two-col">
          <Form.Item name="gender" label="性别">
            <Select
              allowClear
              options={[
                { value: "male", label: "男孩子" },
                { value: "female", label: "女孩子" },
                { value: "unknown", label: "未知" },
              ]}
            />
          </Form.Item>
          <Form.Item name="weight" label="体重（kg）">
            <Input placeholder="例如：8.2" />
          </Form.Item>
        </div>
        <Form.Item name="coat" label="毛色">
          <Input placeholder="例如：赤色" />
        </Form.Item>
        <Form.Item name="likes" label="喜欢的事物">
          <Input placeholder="例如：晒太阳、鸡肉干" />
        </Form.Item>
        <Form.Item name="tags" label="性格标签">
          <Select
            mode="tags"
            maxCount={6}
            tokenSeparators={[","]}
            placeholder="输入后回车添加"
          />
        </Form.Item>
        <Form.Item name="quote" label="主人寄语">
          <Input.TextArea
            rows={3}
            maxLength={200}
            showCount
            placeholder="有你的每一天，都是值得收藏的回忆。"
          />
        </Form.Item>
        <Form.Item name="quoteAuthor" label="寄语署名">
          <Input placeholder="例如：爱你的家人" />
        </Form.Item>
        <Form.Item label="头像">
          <Upload
            accept="image/jpeg,image/png,image/webp,image/gif"
            maxCount={1}
            beforeUpload={() => false}
            fileList={avatar}
            onChange={({ fileList }) => setAvatar(fileList)}
          >
            <Button>选择头像</Button>
          </Upload>
          <small className="upload-hint">
            单张图片，最大 5MB。保存资料时上传。
          </small>
        </Form.Item>
        {error && <Alert type="error" showIcon message={error} />}
        <div className="form-actions">
          <Button
            shape="round"
            className="soft-ant"
            onClick={() => navigate("/dashboard")}
          >
            取消
          </Button>
          <Button type="primary" shape="round" htmlType="submit" loading={busy}>
            {busy ? "保存中…" : "保存资料 →"}
          </Button>
        </div>
      </Form>
    </main>
  );
}

function Memories({ id }: { id: string }) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [items, setItems] = useState<Memory[]>([]);
  const [editing, setEditing] = useState<Memory | null | "new">(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.pet(id), api.memories(id)])
      .then(([p, m]) => {
        setPet(p);
        setItems(m);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  const remove = async (memoryId: string) => {
    try {
      await api.deleteMemory(id, memoryId);
      setItems((list) => list.filter((item) => item.id !== memoryId));
      message.success("回忆已删除");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "删除失败");
    }
  };
  if (!pet)
    return (
      <main className="content">
        {error ? <Notice text={error} /> : <Loading />}
      </main>
    );
  return (
    <main className="content">
      <button className="back" onClick={() => navigate("/dashboard")}>
        ← 返回我的宠物
      </button>
      <div className="heading-row">
        <div>
          <span className="eyebrow">PET JOURNAL</span>
          <h1>{pet.name}的成长回忆</h1>
          <p>把第一次见面、一次出游，还有平凡的快乐，都留在这里。</p>
        </div>
        <Button type="primary" shape="round" onClick={() => setEditing("new")}>
          ＋ 添加一段回忆
        </Button>
      </div>
      {error && <Notice text={error} />}
      {items.length === 0 ? (
        <Empty
          title="第一段回忆，等你来写"
          text="可以只写文字，也可以放上一张照片。"
          action="添加一段回忆"
          onAction={() => setEditing("new")}
        />
      ) : (
        <div className="memory-grid">
          {items.map((memory) => (
            <article className="memory-card" key={memory.id}>
              <div className="memory-head">
                <div>
                  <span className="eyebrow">{memory.date || "未设置日期"}</span>
                  <h2>{memory.title}</h2>
                </div>
                <div className="memory-actions">
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setEditing(memory)}
                  >
                    编辑
                  </Button>
                  <Popconfirm
                    title="删除这段回忆？"
                    description="删除后这段文字将无法恢复。"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={() => remove(memory.id)}
                  >
                    <Button type="link" danger size="small">
                      删除
                    </Button>
                  </Popconfirm>
                </div>
              </div>
              <p>{memory.text}</p>
              {memory.photoUrl && (
                <img
                  className="memory-photo"
                  src={memory.photoUrl}
                  alt={memory.title}
                />
              )}
            </article>
          ))}
        </div>
      )}
      {editing && (
        <MemoryModal
          petId={id}
          memory={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={(memory) => {
            setItems((list) =>
              editing === "new"
                ? [memory, ...list]
                : list.map((item) => (item.id === memory.id ? memory : item)),
            );
            setEditing(null);
          }}
        />
      )}
    </main>
  );
}
function MemoryModal({
  petId,
  memory,
  onClose,
  onSaved,
}: {
  petId: string;
  memory?: Memory;
  onClose: () => void;
  onSaved: (memory: Memory) => void;
}) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>(
    memory?.photoUrl
      ? [{ uid: "-1", name: "当前图片", status: "done", url: memory.photoUrl }]
      : [],
  );
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    form.setFieldsValue({
      title: memory?.title,
      date: memory?.date ? dayjs(memory.date) : undefined,
      text: memory?.text,
    });
  }, [form, memory]);
  const submit = async (values: {
    title: string;
    date?: dayjs.Dayjs;
    text?: string;
  }) => {
    setBusy(true);
    try {
      let photoUrl = memory?.photoUrl || null;
      const file = fileList[0]?.originFileObj;
      if (file) photoUrl = (await api.uploadImage(file, "memory")).url;
      const payload = {
        title: values.title,
        date: values.date?.format("YYYY-MM-DD") || null,
        text: values.text || "",
        photoUrl,
      };
      const saved = memory
        ? await api.updateMemory(petId, memory.id, payload)
        : await api.createMemory(petId, payload as Omit<Memory, "id">);
      message.success(memory ? "回忆已更新" : "回忆已添加");
      onSaved(saved);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={
        <div>
          <span className="eyebrow">KEEP THIS MOMENT</span>
          <h2 className="modal-title">
            {memory ? "编辑回忆" : "添加一段回忆"}
          </h2>
        </div>
      }
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="title"
          label="回忆标题"
          rules={[{ required: true, message: "请输入回忆标题" }]}
        >
          <Input maxLength={80} placeholder="例如：第一次去看海" />
        </Form.Item>
        <Form.Item name="date" label="发生日期">
          <DatePicker className="full-input" />
        </Form.Item>
        <Form.Item name="text" label="记录这一刻">
          <Input.TextArea
            rows={5}
            maxLength={4000}
            showCount
            placeholder="那天的阳光、你的表情，还有想记住的小事……"
          />
        </Form.Item>
        <Form.Item label="照片">
          <Upload
            accept="image/jpeg,image/png,image/webp,image/gif"
            maxCount={1}
            listType="picture-card"
            beforeUpload={() => false}
            fileList={fileList}
            onChange={({ fileList: next }) => setFileList(next.slice(-1))}
            onPreview={(file) =>
              window.open(
                file.url || URL.createObjectURL(file.originFileObj!),
                "_blank",
              )
            }
          >
            <span>＋ 上传照片</span>
          </Upload>
          <small className="upload-hint">每段回忆最多一张，最大 5MB。</small>
        </Form.Item>
        <div className="form-actions">
          <Button shape="round" className="soft-ant" onClick={onClose}>
            取消
          </Button>
          <Button type="primary" shape="round" htmlType="submit" loading={busy}>
            {busy ? "处理中…" : "保存回忆 →"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

function Share({ id }: { id: string }) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [qr, setQr] = useState("");
  const [messageText, setMessageText] = useState("");
  const [publishing, setPublishing] = useState(false);
  useEffect(() => {
    api
      .pet(id)
      .then(async (p) => {
        setPet(p);
        setQr(
          await QRCode.toDataURL(`${location.origin}/p/${p.slug}`, {
            width: 220,
            margin: 1,
            color: { dark: "#393632", light: "#fbf8f2" },
          }),
        );
      })
      .catch((e) => setMessageText(e.message));
  }, [id]);
  if (!pet)
    return (
      <main className="content">
        {messageText ? <Notice text={messageText} /> : <Loading />}
      </main>
    );
  const url = `${location.origin}/p/${pet.slug}`;
  const changePublished = async (isPublished: boolean) => {
    setPublishing(true);
    try {
      const updated = await api.sharing(id, { isPublished });
      setPet(updated);
      message.success(isPublished ? "名片已公开" : "名片已停止公开");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "更新分享状态失败",
      );
    } finally {
      setPublishing(false);
    }
  };
  return (
    <main className="content narrow">
      <button className="back" onClick={() => navigate("/dashboard")}>
        ← 返回我的宠物
      </button>
      <div className="form-title">
        <span className="eyebrow">SHARE YOUR STORY</span>
        <h1>分享 {pet.name}</h1>
        <p>链接永久有效，亲友打开链接或扫描二维码即可查看。</p>
      </div>
      <div className="panel share-panel">
        <div className="share-preview">
          <Image src={pet.avatarUrl} alt={pet.name} className="share-avatar" />
          <div>
            <b>{pet.name}的成长记录</b>
            <span>{url}</span>
          </div>
        </div>
        <div className="publish-row">
          <div>
            <b>公开这张名片</b>
            <span>
              {pet.isPublished
                ? "亲友可通过链接或二维码查看"
                : "开启后，分享链接才可访问"}
            </span>
          </div>
          <Switch
            checked={pet.isPublished}
            loading={publishing}
            onChange={changePublished}
          />
        </div>
        <div className="qr-wrap">
          {qr && <img src={qr} alt={`${pet.name}的分享二维码`} />}
          <p>保存二维码，分享给在乎的人</p>
        </div>
        <div className="share-url">
          <Input readOnly value={url} />
          <Button
            onClick={() => {
              navigator.clipboard?.writeText(url);
              message.success("链接已复制");
            }}
          >
            复制
          </Button>
        </div>
        {messageText && <p className="success">{messageText}</p>}
      </div>
    </main>
  );
}

function Public({ slug }: { slug: string }) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .publicPet(slug)
      .then(setPet)
      .catch((e) => setError(e.message));
  }, [slug]);
  if (!pet)
    return (
      <main className="public">
        {error ? <Notice text={error} /> : <Loading />}
      </main>
    );
  return (
    <main className="public">
      <article className="public-sheet">
        <button className="wordmark" onClick={() => navigate("/")}>
          ✦ <b>宠物时光</b>
        </button>
        <div className="public-intro">
          <Image src={pet.avatarUrl} alt={pet.name} className="public-avatar" />
          <h1>{pet.name}</h1>
          <p>{pet.bio || "每一个日常，都值得被珍藏。"}</p>
        </div>
        <div className="public-stats">
          <div>
            <b>{pet.breed || "—"}</b>
            <span>品种</span>
          </div>
          <div>
            <b>{pet.memories?.length || 0}</b>
            <span>篇回忆</span>
          </div>
          <div>
            <b>{pet.viewCount || 0}</b>
            <span>次查看</span>
          </div>
        </div>
        <section>
          <div className="section-title">
            <h2>关于{pet.name}</h2>
            <span>ABOUT</span>
          </div>
          <p className="public-bio">{pet.bio || "故事正在慢慢发生。"}</p>
          <div className="profile-grid">
            {pet.arrivalDate && <span>来到家里：{pet.arrivalDate}</span>}
            {pet.gender && (
              <span>
                性别：
                {pet.gender === "male"
                  ? "男孩子"
                  : pet.gender === "female"
                    ? "女孩子"
                    : "未知"}
              </span>
            )}
            {pet.weight && <span>体重：{pet.weight} kg</span>}
            {pet.coat && <span>毛色：{pet.coat}</span>}
            {pet.likes && <span>喜欢：{pet.likes}</span>}
          </div>
          {pet.tags?.length > 0 && (
            <div className="tags">
              {pet.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="section-title">
            <h2>我们的回忆</h2>
            <span>MEMORIES</span>
          </div>
          {pet.memories?.map((memory) => (
            <article className="public-memory" key={memory.id}>
              <span className="eyebrow">{memory.date || "未设置日期"}</span>
              <h3>{memory.title}</h3>
              <p>{memory.text}</p>
              {memory.photoUrl && (
                <img src={memory.photoUrl} alt={memory.title} />
              )}
            </article>
          ))}
        </section>
        {pet.quote && (
          <blockquote>
            “{pet.quote}”<cite>— {pet.quoteAuthor || "爱你的家人"}</cite>
          </blockquote>
        )}
      </article>
    </main>
  );
}

export default function App() {
  const [current, setCurrent] = useState(getRoute());
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const listener = () => setCurrent(getRoute());
    addEventListener("popstate", listener);
    api
      .me()
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
    return () => removeEventListener("popstate", listener);
  }, []);
  const logout = async () => {
    await api.logout().catch(() => undefined);
    setUser(null);
    navigate("/");
  };
  const protectedRoute = [
    "dashboard",
    "new",
    "edit",
    "memories",
    "share",
  ].includes(current.name);
  if (!ready && protectedRoute)
    return (
      <div className="site">
        <Loading />
      </div>
    );
  if (protectedRoute && !user) {
    navigate("/login");
    return null;
  }
  let view: ReactNode;
  if (current.name === "home") view = <Home user={user} authReady={ready} />;
  else if (current.name === "login" || current.name === "register")
    view = <Auth mode={current.name} onAuth={setUser} />;
  else if (current.name === "dashboard") view = <Dashboard user={user!} />;
  else if (current.name === "new" || current.name === "edit")
    view = <PetEditor id={current.id} />;
  else if (current.name === "memories") view = <Memories id={current.id!} />;
  else if (current.name === "share") view = <Share id={current.id!} />;
  else view = <Public slug={current.slug!} />;
  return ["public", "login", "register"].includes(current.name) ? (
    <div className="site">{view}</div>
  ) : (
    <Layout user={user} onLogout={logout}>
      {view}
    </Layout>
  );
}
