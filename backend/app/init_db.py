"""初始化默认板块数据"""

from app.db.session import SessionLocal
from app.models.category import Category


def init_categories():
    """插入默认板块"""
    categories = [
        {"name": "综合讨论", "slug": "general", "description": "RustPBX 相关的综合交流", "sort_order": 1},
        {"name": "安装部署", "slug": "installation", "description": "安装、配置与部署相关问题", "sort_order": 2},
        {"name": "SIP 配置", "slug": "sip-config", "description": "SIP 协议、注册、分机配置", "sort_order": 3},
        {"name": "路由中继", "slug": "routing", "description": "路由配置、SipTrunk、线路管理", "sort_order": 4},
        {"name": "故障排查", "slug": "troubleshooting", "description": "Bug 反馈与问题排查", "sort_order": 5},
        {"name": "WebRTC", "slug": "webrtc", "description": "WebRTC 相关讨论与技术分享", "sort_order": 6},
        {"name": "灌水区", "slug": "off-topic", "description": "轻松闲聊，技术之外的话题", "sort_order": 99},
    ]

    db = SessionLocal()
    for cat_data in categories:
        existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if not existing:
            db.add(Category(**cat_data))
            print(f"  已添加板块: {cat_data['name']}")
        else:
            print(f"  已存在板块: {cat_data['name']}")
    db.commit()
    db.close()
    print("板块初始化完成")


if __name__ == "__main__":
    init_categories()
