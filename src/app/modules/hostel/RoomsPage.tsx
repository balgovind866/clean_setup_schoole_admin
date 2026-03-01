import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Rooms: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Rooms</h3>
        </div>
        <div className='card-body'>
          <p>Room allocation and management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const RoomsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Rooms</PageTitle>
      <Rooms />
    </>
  )
}

export { RoomsWrapper }
