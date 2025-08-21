'use client'

import { useState, useEffect } from 'react'
import { useUIConfigStore, SidebarMenuItem } from '@/lib/stores/ui-config.store'
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical,
  Save,
  X
} from 'lucide-react'

export default function SidebarMenuManager() {
  const { config, updateSidebarMainMenu, updateSidebarCategoryMenu, updateSidebarSettingsMenu } = useUIConfigStore()
  const [activeSection, setActiveSection] = useState<'main' | 'category' | 'settings'>('main')
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<SidebarMenuItem | null>(null)
  const [formData, setFormData] = useState({
    id: '',
    label: '',
    href: '',
    icon: '',
    order: 0,
    visible: true,
    section: 'main' as 'main' | 'category' | 'settings'
  })

  const sections = [
    { id: 'main', label: '메인 메뉴', items: config.sidebar?.mainMenu || [] },
    { id: 'category', label: '카테고리', items: config.sidebar?.categoryMenu || [] },
    { id: 'settings', label: '설정', items: config.sidebar?.settingsMenu || [] }
  ]

  const availableIcons = [
    'Home', 'Tv', 'Video', 'Fire', 'Plus', 'Building', 'TrendingUp', 
    'Car', 'UtensilsCrossed', 'Plane', 'Gamepad2', 'Settings', 
    'HelpCircle', 'MessageSquare', 'User', 'Search', 'Bell', 'Heart'
  ]

  const getCurrentItems = () => {
    switch (activeSection) {
      case 'main':
        return config.sidebar?.mainMenu || []
      case 'category':
        return config.sidebar?.categoryMenu || []
      case 'settings':
        return config.sidebar?.settingsMenu || []
      default:
        return []
    }
  }

  const updateCurrentSection = (items: SidebarMenuItem[]) => {
    switch (activeSection) {
      case 'main':
        updateSidebarMainMenu(items)
        break
      case 'category':
        updateSidebarCategoryMenu(items)
        break
      case 'settings':
        updateSidebarSettingsMenu(items)
        break
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(getCurrentItems())
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1
    }))

    updateCurrentSection(updatedItems)
  }

  const handleAddItem = () => {
    const newItem: SidebarMenuItem = {
      id: `${activeSection}-${Date.now()}`,
      label: formData.label,
      href: formData.href,
      icon: formData.icon,
      order: getCurrentItems().length + 1,
      visible: formData.visible,
      section: activeSection
    }

    const updatedItems = [...getCurrentItems(), newItem]
    updateCurrentSection(updatedItems)
    resetForm()
  }

  const handleEditItem = (item: SidebarMenuItem) => {
    setEditingItem(item)
    setFormData({
      id: item.id,
      label: item.label,
      href: item.href,
      icon: item.icon,
      order: item.order,
      visible: item.visible,
      section: item.section
    })
    setIsEditing(true)
  }

  const handleUpdateItem = () => {
    if (!editingItem) return

    const items = getCurrentItems()
    const updatedItems = items.map(item => 
      item.id === editingItem.id
        ? { ...item, ...formData }
        : item
    )

    updateCurrentSection(updatedItems)
    resetForm()
  }

  const handleDeleteItem = (id: string) => {
    const items = getCurrentItems()
    const updatedItems = items.filter(item => item.id !== id)
    updateCurrentSection(updatedItems)
  }

  const handleToggleVisibility = (id: string) => {
    const items = getCurrentItems()
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, visible: !item.visible } : item
    )
    updateCurrentSection(updatedItems)
  }

  const resetForm = () => {
    setFormData({
      id: '',
      label: '',
      href: '',
      icon: '',
      order: 0,
      visible: true,
      section: activeSection
    })
    setIsEditing(false)
    setEditingItem(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">사이드바 메뉴 관리</h2>
        
        {/* Section Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Menu Items List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {sections.find(s => s.id === activeSection)?.label} 항목
              </h3>
              <span className="text-sm text-gray-500">
                {getCurrentItems().length}개 항목
              </span>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId={activeSection}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {getCurrentItems().map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-gray-50 rounded-lg p-4 border ${
                              snapshot.isDragging ? 'border-indigo-300 shadow-lg' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-gray-400 hover:text-gray-600 cursor-grab"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">
                                      {item.label}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({item.icon})
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.href}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleToggleVisibility(item.id)}
                                  className={`p-1 rounded ${
                                    item.visible
                                      ? 'text-green-600 hover:bg-green-50'
                                      : 'text-gray-400 hover:bg-gray-50'
                                  }`}
                                >
                                  {item.visible ? (
                                    <Eye className="w-4 h-4" />
                                  ) : (
                                    <EyeOff className="w-4 h-4" />
                                  )}
                                </button>
                                
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Add/Edit Form */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isEditing ? '메뉴 항목 수정' : '새 메뉴 항목 추가'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메뉴 이름
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="메뉴 이름을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  링크 URL
                </label>
                <input
                  type="text"
                  value={formData.href}
                  onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="/example"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  아이콘
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">아이콘 선택</option>
                  {availableIcons.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="visible"
                  checked={formData.visible}
                  onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="visible" className="text-sm font-medium text-gray-700">
                  메뉴에 표시
                </label>
              </div>

              <div className="flex space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleUpdateItem}
                      disabled={!formData.label || !formData.href || !formData.icon}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      수정하기
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddItem}
                    disabled={!formData.label || !formData.href || !formData.icon}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    추가하기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}