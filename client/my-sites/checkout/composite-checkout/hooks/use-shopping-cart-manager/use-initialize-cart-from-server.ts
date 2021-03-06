/**
 * External dependencies
 */
import { useEffect, useRef } from 'react';
import debugFactory from 'debug';

/**
 * Internal dependencies
 */
import {
	convertResponseCartToRequestCart,
	ResponseCart,
	RequestCart,
	RequestCartProduct,
	addItemToResponseCart,
	convertRawResponseCartToResponseCart,
	addCouponToResponseCart,
} from '../../types/backend/shopping-cart-endpoint';
import { CacheStatus, ShoppingCartAction, ReactStandardAction } from './types';

const debug = debugFactory( 'calypso:composite-checkout:use-initialize-cart-from-server' );

export default function useInitializeCartFromServer(
	cacheStatus: CacheStatus,
	canInitializeCart: boolean,
	productsToAdd: RequestCartProduct[] | null,
	couponToAdd: string | null,
	getCart: () => Promise< ResponseCart >,
	setCart: ( arg0: RequestCart ) => Promise< ResponseCart >,
	hookDispatch: ( arg0: ShoppingCartAction ) => void,
	onEvent?: ( arg0: ReactStandardAction ) => void
): void {
	const isInitialized = useRef( false );
	useEffect( () => {
		if ( cacheStatus !== 'fresh' ) {
			debug( 'not initializing cart; cacheStatus is not fresh' );
			return;
		}
		if ( canInitializeCart !== true ) {
			debug( 'not initializing cart; canInitializeCart is not true' );
			return;
		}

		if ( isInitialized.current ) {
			debug( 'not initializing cart; already initialized' );
			return;
		}
		isInitialized.current = true;
		debug( `initializing the cart; cacheStatus is ${ cacheStatus }` );

		getCart()
			.then( ( response ) => {
				if ( productsToAdd?.length || couponToAdd ) {
					debug(
						'initialized cart is',
						response,
						'; proceeding to add initial products',
						productsToAdd,
						' and coupons',
						couponToAdd
					);
					let responseCart = convertRawResponseCartToResponseCart( response );
					if ( productsToAdd?.length ) {
						responseCart = productsToAdd.reduce( ( updatedCart, productToAdd ) => {
							onEvent?.( {
								type: 'CART_ADD_ITEM',
								payload: productToAdd,
							} );
							return addItemToResponseCart( updatedCart, productToAdd );
						}, responseCart );
					}
					if ( couponToAdd ) {
						responseCart = addCouponToResponseCart( responseCart, couponToAdd );
					}
					return setCart( convertResponseCartToRequestCart( responseCart ) );
				}
				return response;
			} )
			.then( ( response ) => {
				debug( 'initialized cart is', response );
				const initialResponseCart = convertRawResponseCartToResponseCart( response );
				hookDispatch( {
					type: 'RECEIVE_INITIAL_RESPONSE_CART',
					initialResponseCart,
				} );
				onEvent?.( {
					type: 'CART_INIT_COMPLETE',
					payload: initialResponseCart,
				} );
			} )
			.catch( ( error ) => {
				// TODO: figure out what to do here
				debug( 'error while initializing cart', error );
				hookDispatch( { type: 'RAISE_ERROR', error: 'GET_SERVER_CART_ERROR', message: error } );
				onEvent?.( {
					type: 'CART_ERROR',
					payload: { type: 'GET_SERVER_CART_ERROR', message: error },
				} );
			} );
	}, [
		cacheStatus,
		canInitializeCart,
		hookDispatch,
		onEvent,
		getCart,
		productsToAdd,
		couponToAdd,
		setCart,
	] );
}
