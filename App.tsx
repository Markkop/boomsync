import React from 'react';
import { TimerView } from './components/TimerView';
import { ShuffleView } from './components/ShuffleView';
import { RolesView } from './components/RolesView';
import { CharacterDetailModal } from './components/CharacterDetailModal';
import { RoleListModal } from './components/RoleListModal';
import { KeywordTooltip } from './components/KeywordTooltip';
import { CharacterPeekTooltip } from './components/CharacterPeekTooltip';
import { RequiresTooltip } from './components/RequiresTooltip';
import { SyncModal } from './components/SyncModal';
import { ConfigModal } from './components/ConfigModal';
import { FullscreenTimer } from './components/FullscreenTimer';
import { CardRevealModal } from './components/CardRevealModal';
import { IdentityModal } from './components/IdentityModal';
import { Icon } from './components/Icon';
import { TapSafeButton } from './components/TapSafeButton';
import { getAllCharacters } from './services/characterService';
import { useBoomSyncApp } from './useBoomSyncApp';

const App: React.FC = () => {
  const {
    activeFullscreenTimer,
    addRoles,
    applyPreset,
    assignIdentity,
    audioRef,
    beepAudioRef,
    broadcastState,
    cardReveal,
    characterPeekName,
    characterPeekPosition,
    clearAllRoles,
    connectedPeerIds,
    connectionCount,
    cycleRoundCount,
    explosionAudioRef,
    fullscreenTimerId,
    gameState,
    gameStateRef,
    handleRevealBuriedCard,
    handleRevealMyCard,
    handleRevealPlayerCard,
    handleShare,
    handleShuffle,
    handleTimerClick,
    handleTimerReset,
    handleToggleDarken,
    identityDismissed,
    initialRoomCode,
    isConnected,
    isHost,
    isSyncRoomMode,
    keywordTooltipPosition,
    keywordTooltipText,
    lastDealIdRef,
    localPrefs,
    lockedRoles,
    myPeerId,
    myPlayer,
    myPlayerId,
    myRoleName,
    navigateToCharacter,
    requiresTooltipData,
    resetTimer,
    roomCode,
    selectSound,
    setActiveTab,
    setCardReveal,
    setCharacterPeekName,
    setCharacterPeekPosition,
    setConnectedPeerIds,
    setConnectionCount,
    setFullscreenTimerId,
    setGameState,
    setIdentityDismissed,
    setInitialRoomCode,
    setIsConnected,
    setIsEditingPlayers,
    setIsHost,
    setKeywordTooltipPosition,
    setKeywordTooltipText,
    setLocalPrefs,
    setLockedRoles,
    setMyPeerId,
    setRequiresTooltipData,
    setRolesSearchQuery,
    setRolesTagFilter,
    setRolesTeamFilter,
    setRoomCode,
    setSelectedCharacter,
    setShowCharacterPeekTooltip,
    setShowConfigModal,
    setShowIdentityModal,
    setShowKeywordTooltip,
    setShowRequiresTooltip,
    setShowRoleListModal,
    setShowSyncModal,
    setVolume,
    showCharacterPeek,
    showCharacterPeekTooltip,
    showConfigModal,
    showIdentityModal,
    showKeyword,
    showKeywordTooltip,
    showMyCardButton,
    showRequires,
    showRequiresTooltip,
    showSyncModal,
    showWhoAmIButton,
    t,
    toggleAutoFullscreen,
    toggleBombSound,
    toggleDarkenTimer,
    toggleKeepScreenAwake,
    toggleLockRole,
    toggleRole,
    toggleShowRoleCards,
    toggleSound,
    toggleTimer,
    updatePlayers
  } = useBoomSyncApp();

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative select-none">
      <audio ref={audioRef} loop />
      
      {/* Fullscreen Timer Overlay */}
      {activeFullscreenTimer && (
        <FullscreenTimer 
          timer={activeFullscreenTimer} 
          onToggle={handleTimerClick}
          onReset={handleTimerReset}
          onToggleDarken={handleToggleDarken}
          onClose={() => setFullscreenTimerId(null)}
          onShare={() => setShowSyncModal(true)}
          isUsed={gameState.usedTimerIds.includes(activeFullscreenTimer.id)}
          isSoundOn={localPrefs.isSoundOn}
          onToggleSound={toggleSound}
        />
      )}
      
      {/* Top Bar */}
      <header className="flex items-center justify-between p-4 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-900">
        <div className="flex gap-2">
          <button 
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-400 active:bg-zinc-700"
          >
            <Icon name="settings" size={20} />
          </button>
          {gameState.activeTab !== 'roles' ? (
            <>
              <button 
                onClick={() => setShowRoleListModal(true)}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-400 active:bg-zinc-700"
              >
                <Icon name="list" size={20} />
              </button>
              <button 
                onClick={toggleSound}
                className={`p-2 rounded-xl bg-zinc-800 active:bg-zinc-700 ${localPrefs.isSoundOn ? 'text-cyan-400' : 'text-zinc-400'}`}
              >
                <Icon name={localPrefs.isSoundOn ? "volumeOn" : "volumeOff"} size={20} />
              </button>
              <button 
                onClick={toggleAutoFullscreen}
                className={`p-2 rounded-xl bg-zinc-800 active:bg-zinc-700 ${localPrefs.autoFullscreen ? 'text-purple-400' : 'text-zinc-400'}`}
              >
                <Icon name="proportions" size={20} />
              </button>
              {gameState.activeTab === 'timers' && (
                <button 
                  onClick={cycleRoundCount}
                  className="p-2 rounded-xl bg-zinc-800 text-cyan-400 active:bg-zinc-700 transition-transform active:scale-95"
                >
                  <Icon name="timer" size={20} />
                </button>
              )}
            </>
          ) : (
            <button 
              onClick={() => setShowRoleListModal(true)}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 active:bg-zinc-700"
            >
              <Icon name="list" size={20} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showMyCardButton && (
            <TapSafeButton
              onTap={handleRevealMyCard}
              className="px-3 py-2 rounded-xl bg-zinc-800 text-cyan-400 active:bg-zinc-700 text-xs font-black uppercase tracking-wide"
            >
              {t('app.myCard')}
            </TapSafeButton>
          )}
          {showWhoAmIButton && (
            <TapSafeButton
              onTap={() => setShowIdentityModal(true)}
              className="px-3 py-2 rounded-xl bg-zinc-800 text-amber-400 active:bg-zinc-700 text-xs font-black uppercase tracking-wide"
            >
              {t('app.whoAmI')}
            </TapSafeButton>
          )}
          <button 
            onClick={() => setShowSyncModal(true)}
            className={`p-2 rounded-xl bg-zinc-800 active:bg-zinc-700 transition-colors relative ${isConnected ? 'text-green-400' : 'text-zinc-400'}`}
          >
            <Icon name="share" size={20} />
            {isConnected && connectionCount > 1 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {connectionCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden pb-20 flex flex-col">
        {gameState.activeTab === 'timers' ? (
          <TimerView 
            timers={gameState.timers} 
            onToggle={handleTimerClick} 
            onReset={handleTimerReset}
            onToggleDarken={handleToggleDarken}
            usedTimerIds={gameState.usedTimerIds}
          />
        ) : gameState.activeTab === 'shuffle' ? (
          <div className="overflow-y-auto no-scrollbar flex-1">
            <ShuffleView 
              players={gameState.players}
              roomA={gameState.roomA}
              roomB={gameState.roomB}
              onUpdatePlayers={updatePlayers}
              onShuffle={handleShuffle}
              isEditing={gameState.isEditingPlayers}
              onSetEditing={setIsEditingPlayers}
              roleDeal={gameState.roleDeal}
              selectedRoleCount={gameState.selectedRoles.length}
              showRoleCards={gameState.showRoleCards}
              isPhonePassMode={!isSyncRoomMode}
              canShuffle={!isSyncRoomMode || isHost}
              myPlayerName={myPlayer?.name ?? null}
              onRevealPlayerCard={handleRevealPlayerCard}
              onRevealBuriedCard={handleRevealBuriedCard}
              onOpenIdentity={isSyncRoomMode ? () => setShowIdentityModal(true) : undefined}
            />
          </div>
        ) : (
          <RolesView
            searchQuery={gameState.rolesSearchQuery}
            teamFilter={gameState.rolesTeamFilter}
            tagFilter={gameState.rolesTagFilter}
            selectedRoles={gameState.selectedRoles}
            onSearchChange={setRolesSearchQuery}
            onTeamFilterChange={setRolesTeamFilter}
            onTagFilterChange={setRolesTagFilter}
            onCharacterTap={(name) => setSelectedCharacter(name)}
            onCharacterLongPress={toggleRole}
            onOpenRoleList={() => setShowRoleListModal(true)}
            onClearAll={clearAllRoles}
            onApplyPreset={applyPreset}
            lockedRoles={lockedRoles}
            onToggleLock={toggleLockRole}
            onShowKeyword={showKeyword}
            onShowRequires={showRequires}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-950 border-t border-zinc-900 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex z-40 w-full">
        <button 
          onClick={() => setActiveTab('timers')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all min-w-0 ${gameState.activeTab === 'timers' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-zinc-500 hover:bg-zinc-900'}`}
        >
          <Icon name="timer" size={20} />
          <span className="font-semibold">{t('nav.timer')}</span>
        </button>
        <button 
          onClick={() => setActiveTab('shuffle')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all min-w-0 ${gameState.activeTab === 'shuffle' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-zinc-500 hover:bg-zinc-900'}`}
        >
          <Icon name="users" size={20} />
          <span className="font-semibold">{t('nav.shuffle')}</span>
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all min-w-0 ${gameState.activeTab === 'roles' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-zinc-500 hover:bg-zinc-900'}`}
        >
          <Icon name="list" size={20} />
          <span className="font-semibold">{t('nav.roles')}</span>
        </button>
      </nav>

      {/* Modals */}
      {showConfigModal && (
        <ConfigModal
          isSoundOn={localPrefs.isSoundOn}
          toggleSound={toggleSound}
          autoFullscreen={localPrefs.autoFullscreen}
          toggleAutoFullscreen={toggleAutoFullscreen}
          isBombSoundOn={gameState.isBombSoundOn}
          toggleBombSound={toggleBombSound}
          showRoleCards={gameState.showRoleCards}
          toggleShowRoleCards={toggleShowRoleCards}
          keepScreenAwake={localPrefs.keepScreenAwake}
          toggleKeepScreenAwake={toggleKeepScreenAwake}
          selectedSound={localPrefs.selectedSound}
          onSelectSound={selectSound}
          volume={localPrefs.volume}
          onVolumeChange={setVolume}
          onClose={() => setShowConfigModal(false)}
        />
      )}
      
      {showSyncModal && (
        <SyncModal 
          initialCode={initialRoomCode}
          onClose={() => setShowSyncModal(false)} 
          onToggle={() => setShowSyncModal(false)}
          players={gameState.players}
          peerIdentities={gameState.peerIdentities}
          myPeerId={myPeerId}
          connectedPeerIds={connectedPeerIds}
          onAssignIdentity={assignIdentity}
        />
      )}

      {showIdentityModal && myPeerId && (
        <IdentityModal
          players={gameState.players}
          peerIdentities={gameState.peerIdentities}
          myPeerId={myPeerId}
          isHost={isHost}
          connectedPeerIds={connectedPeerIds}
          onAssign={assignIdentity}
          onClose={() => {
            setShowIdentityModal(false);
            setIdentityDismissed(true);
          }}
        />
      )}

      {gameState.showRoleCards && cardReveal && (
        <CardRevealModal
          request={cardReveal}
          roleDeal={gameState.roleDeal}
          onClose={() => setCardReveal(null)}
        />
      )}

      {/* Roles Modals */}
      {gameState.selectedCharacterName && (
        <CharacterDetailModal
          characterName={gameState.selectedCharacterName}
          isSelected={gameState.selectedRoles.includes(gameState.selectedCharacterName)}
          isLocked={lockedRoles.includes(gameState.selectedCharacterName)}
          onClose={() => {
            setSelectedCharacter(null);
            // Keep role list modal open if it was open (modal stacking)
          }}
          onSelectCharacter={setSelectedCharacter}
          onToggleRole={toggleRole}
          onToggleLock={toggleLockRole}
          onNavigateToCharacter={navigateToCharacter}
          onShowCharacterPeek={showCharacterPeek}
          onShowKeyword={showKeyword}
          onAddRoles={addRoles}
        />
      )}

      {gameState.showRoleListModal && (
        <RoleListModal
          selectedRoles={gameState.selectedRoles}
          onClose={() => setShowRoleListModal(false)}
          onCharacterTap={(name) => {
            setSelectedCharacter(name);
            // Don't close role list modal - modal stacking
          }}
          lockedRoles={lockedRoles}
          onToggleLock={toggleLockRole}
          onShowKeyword={showKeyword}
          onShowRequires={showRequires}
        />
      )}

      {showKeywordTooltip && keywordTooltipPosition && (
        <KeywordTooltip
          keyword={keywordTooltipText}
          position={keywordTooltipPosition}
          onClose={() => {
            setShowKeywordTooltip(false);
            setKeywordTooltipPosition(null);
          }}
        />
      )}

      {showCharacterPeekTooltip && characterPeekName && characterPeekPosition && (() => {
        const character = getAllCharacters().find(c => c.name === characterPeekName);
        return character ? (
          <CharacterPeekTooltip
            character={character}
            position={characterPeekPosition}
            onClose={() => {
              setShowCharacterPeekTooltip(false);
              setCharacterPeekName(null);
              setCharacterPeekPosition(null);
            }}
            onOpenDetail={() => {
              setShowCharacterPeekTooltip(false);
              setCharacterPeekName(null);
              setCharacterPeekPosition(null);
              setSelectedCharacter(characterPeekName);
            }}
            onShowKeyword={showKeyword}
            onShowRequires={showRequires}
          />
        ) : null;
      })()}

      {showRequiresTooltip && requiresTooltipData && (
        <RequiresTooltip
          requires={requiresTooltipData.requires}
          requiresGroup={requiresTooltipData.requiresGroup}
          characterName={requiresTooltipData.characterName}
          position={requiresTooltipData.position}
          onClose={() => {
            setShowRequiresTooltip(false);
            setRequiresTooltipData(null);
          }}
        />
      )}
    </div>
  );
};


export default App;
